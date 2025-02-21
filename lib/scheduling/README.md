# Scheduling System

## Overview
This module handles shift scheduling for a 24/7 dispatch center, ensuring proper coverage while respecting employee preferences and constraints.

## Core Components

### Scoring System (`scoring.ts`)
Evaluates shift assignments using three key factors:

1. **Hours Balance (40%)**
   - Perfect score at target weekly hours
   - Penalizes over/under scheduling
   - Gradual penalty (0.05 per hour difference)

2. **Shift Preference (40%)**
   - Matches employee's preferred shift category (DAY/SWING/NIGHT)
   - Full score for preferred category
   - Half score for non-preferred

3. **Rest Period (20%)**
   - Ideal: 10-14 hours between shifts
   - Minimum: 8 hours (zero score below)
   - Gradual reduction for longer gaps

### Schedule Generation (`generate.ts`)
- Uses greedy algorithm with scoring
- Ensures minimum staffing requirements
- Handles supervisor coverage
- Respects time-off requests

### Optimization (`genetic.ts`)
Currently a placeholder for future genetic algorithm implementation.
Basic scheduling handled by `generate.ts`.

## Requirements

### Staffing Levels
- 5 AM - 9 AM: Min 6 employees
- 9 AM - 9 PM: Min 8 employees
- 9 PM - 1 AM: Min 7 employees
- 1 AM - 5 AM: Min 6 employees
- At least one supervisor per period

### Shift Patterns
- Pattern A: 4x10 hour shifts
- Pattern B: 3x12 hour + 1x4 hour shifts
- All shifts must be consecutive

### Constraints
- 40-hour weekly cap (unless approved)
- Minimum 8-hour rest between shifts
- Honor approved time-off
- Try to accommodate pending time-off

## Usage

```typescript
import { calculateShiftScore } from './scoring'
import { generateSchedule } from './generate'

// Calculate score for a potential assignment
const score = calculateShiftScore(employee, shift, context)

// Generate a complete schedule
const schedule = await generateSchedule({
  startDate,
  endDate,
  employees,
  shiftOptions,
  staffingRequirements
})
```

## Future Improvements
1. Implement genetic algorithm optimization
2. Add fairness scoring for holiday/weekend distribution
3. Enhance pattern adherence scoring
4. Add team-based scheduling preferences 