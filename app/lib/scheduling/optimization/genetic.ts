import type { Schedule, Employee, ShiftOption, StaffingRequirement } from '@/app/types'
import { calculateShiftScore } from '../scoring'
import { validateSchedule } from '../validation'
import { resolveConflicts } from '../conflicts'

interface Individual {
  schedule: Schedule[]
  fitness: number
}

interface GeneticParams {
  populationSize: number
  generations: number
  mutationRate: number
  elitismCount: number
}

const DEFAULT_PARAMS: GeneticParams = {
  populationSize: 100,
  generations: 50,
  mutationRate: 0.1,
  elitismCount: 5
}

export async function optimizeSchedule(
  employees: Employee[],
  shiftOptions: ShiftOption[],
  requirements: StaffingRequirement[],
  params: Partial<GeneticParams> = {}
): Promise<Schedule[]> {
  const geneticParams = { ...DEFAULT_PARAMS, ...params }
  
  // Initialize population
  let population = await initializePopulation(
    employees,
    shiftOptions,
    requirements,
    geneticParams.populationSize
  )

  // Evolution loop
  for (let generation = 0; generation < geneticParams.generations; generation++) {
    // Evaluate fitness
    population = await evaluatePopulation(population)

    // Sort by fitness
    population.sort((a, b) => b.fitness - a.fitness)

    // Check if we've reached optimal solution
    if (population[0].fitness === 1) {
      return population[0].schedule
    }

    // Create next generation
    const nextGeneration: Individual[] = []

    // Elitism
    for (let i = 0; i < geneticParams.elitismCount; i++) {
      nextGeneration.push(population[i])
    }

    // Crossover and mutation
    while (nextGeneration.length < geneticParams.populationSize) {
      const parent1 = selectParent(population)
      const parent2 = selectParent(population)
      
      let child = crossover(parent1, parent2)
      
      if (Math.random() < geneticParams.mutationRate) {
        child = await mutate(child, employees, shiftOptions)
      }
      
      nextGeneration.push(child)
    }

    population = nextGeneration
  }

  // Return best solution
  return population[0].schedule
}

async function initializePopulation(
  employees: Employee[],
  shiftOptions: ShiftOption[],
  requirements: StaffingRequirement[],
  size: number
): Promise<Individual[]> {
  const population: Individual[] = []

  for (let i = 0; i < size; i++) {
    const schedule = await generateRandomSchedule(employees, shiftOptions, requirements)
    population.push({
      schedule,
      fitness: 0 // Will be evaluated later
    })
  }

  return population
}

async function evaluatePopulation(population: Individual[]): Promise<Individual[]> {
  return Promise.all(
    population.map(async individual => {
      const fitness = await evaluateFitness(individual.schedule)
      return { ...individual, fitness }
    })
  )
}

async function evaluateFitness(schedule: Schedule[]): Promise<number> {
  // Validate schedule
  const { isValid, errors } = await validateSchedule(schedule)
  if (!isValid) {
    return 0
  }

  // Check for conflicts
  const { conflicts } = await resolveConflicts(schedule)
  if (conflicts.length > 0) {
    return 0.5 // Partial fitness if there are resolvable conflicts
  }

  // Calculate average shift score
  const totalScore = schedule.reduce((sum, shift) => {
    const score = calculateShiftScore(
      shift,
      schedule.filter(s => s.employeeId === shift.employeeId),
      { id: shift.employeeId } as Employee, // TODO: Pass full employee object
      { id: shift.shiftOptionId } as ShiftOption // TODO: Pass full shift option
    )
    return sum + score.score
  }, 0)

  return totalScore / schedule.length
}

function selectParent(population: Individual[]): Individual {
  // Tournament selection
  const tournamentSize = 5
  const tournament = Array(tournamentSize)
    .fill(0)
    .map(() => population[Math.floor(Math.random() * population.length)])
  
  return tournament.reduce((best, current) => 
    current.fitness > best.fitness ? current : best
  )
}

function crossover(parent1: Individual, parent2: Individual): Individual {
  // Single point crossover
  const crossoverPoint = Math.floor(Math.random() * parent1.schedule.length)
  
  const childSchedule = [
    ...parent1.schedule.slice(0, crossoverPoint),
    ...parent2.schedule.slice(crossoverPoint)
  ]

  return {
    schedule: childSchedule,
    fitness: 0 // Will be evaluated later
  }
}

async function mutate(
  individual: Individual,
  employees: Employee[],
  shiftOptions: ShiftOption[]
): Promise<Individual> {
  const schedule = [...individual.schedule]
  
  // Randomly select a shift to mutate
  const mutationIndex = Math.floor(Math.random() * schedule.length)
  const shift = schedule[mutationIndex]

  // Either change employee or shift option
  if (Math.random() < 0.5) {
    // Change employee
    const newEmployee = employees[Math.floor(Math.random() * employees.length)]
    schedule[mutationIndex] = {
      ...shift,
      employeeId: newEmployee.id
    }
  } else {
    // Change shift option
    const newShiftOption = shiftOptions[Math.floor(Math.random() * shiftOptions.length)]
    schedule[mutationIndex] = {
      ...shift,
      shiftOptionId: newShiftOption.id
    }
  }

  return {
    schedule,
    fitness: 0 // Will be evaluated later
  }
}

async function generateRandomSchedule(
  employees: Employee[],
  shiftOptions: ShiftOption[],
  requirements: StaffingRequirement[]
): Promise<Schedule[]> {
  const schedule: Schedule[] = []

  // For each requirement
  for (const requirement of requirements) {
    const requiredShifts = requirement.minStaff
    
    for (let i = 0; i < requiredShifts; i++) {
      // Randomly select employee and shift option
      const employee = employees[Math.floor(Math.random() * employees.length)]
      const shiftOption = shiftOptions[Math.floor(Math.random() * shiftOptions.length)]

      schedule.push({
        id: `${Date.now()}-${i}`, // Temporary ID
        employeeId: employee.id,
        shiftOptionId: shiftOption.id,
        date: requirement.timeStart.split('T')[0],
        status: 'scheduled'
      })
    }
  }

  return schedule
} 