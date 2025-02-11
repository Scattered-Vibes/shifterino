flowchart TD
  subgraph Authentication
    A[User Login/Signup] --> B{Role Check}
  end

  B -- Manager --> C[Manager Dashboard]
  B -- Employee/Supervisor --> D[Employee/Supervisor Dashboard]

  subgraph Manager Dashboard Features
    C --> E[Dashboard Overview]
    C --> F[Schedule Management]
    C --> Z[Admin Settings]
    C --> P[Reporting & Metrics]
    C --> EM[Employee Management]
  end

  subgraph Employee/Supervisor Dashboard Features
    D --> E
    D --> J[Time-Off Requests]
    D --> K[Shift Swap Requests]
    D --> V[View Schedules]
  end

  subgraph Schedule Management
    F --> G[Calendar & List Views]
    F --> H[Schedule Generation]
    F --> L[On-Call Scheduling]
    F --> M[Schedule Export PDF/CSV/ICS]
  end

  subgraph Data Sources
  Y[Employee Data]
  X[Staffing Requirements]
  W[Shift Options]
  end

  subgraph Error Handling
    I[Conflict & Error Handling]
  end

  subgraph Real-Time
  N[Real-Time Data Updates]
  end
  
  subgraph External Systems
  O[HR/Payroll System Integration]
  end
    

  H --> |"Uses"| X
  H --> |"Uses"| W
  H --> |"Uses"| Y
  H -.-> |"Triggers"| I
  J -.->|"Handled By"| I
  K -.->|"Handled By"| I
  I --> M
  G --> N
  P --> Q[Continuous Monitoring & Alerts]
  G --> P
  M --> O

  classDef module fill:#f9f,stroke:#333,stroke-width:2px;
  classDef entity fill:#ccf,stroke:#333,stroke-width:2px;

  class F,J,K,L,M module;
  class X,Y,W entity;