# Project Requirements Document (PRD)

## 1. Project Overview

This project is about building a comprehensive scheduling system for a 911 dispatch center that operates 24/7. The system is designed to ensure that every shift is staffed properly according to specific timeframes and requirements while also taking into account employee preferences and constraints. It will intelligently balance different shift patterns, manage time-off requests, and enforce a limit of 40 hours per week unless overtime is authorized. With a user-friendly interface, managers will be able to adjust schedules and approve overtime, while employees will be able to submit their availability and time-off requests easily.

The purpose of this project is to ensure uninterrupted service at the 911 dispatch center by meeting all staffing needs, including supervisor coverage, across various shifts from early morning to late night. Success is measured by maintaining the required minimum employee counts at all times, reducing unnecessary overtime, ensuring fairness in shift distribution. Ultimately, the goal is to optimize both employee satisfaction and operational efficiency in a critical environment.

## 2. In-Scope vs. Out-of-Scope

**In-Scope:**

*   Building a scheduling system that supports:

    *   Specific staffing requirements for four distinct time periods (5:00 AM–9:00 AM, 9:00 AM–9:00 PM, 9:00 PM–1:00 AM, 1:00 AM–5:00 AM) with designated minimum employee counts and supervisor presence.
    *   Two shift patterns: Pattern A (four consecutive 10-hour shifts) and Pattern B (three consecutive 12-hour shifts plus one 4-hour shift).
    *   Multiple shift options (Day Shift Early, Day Shift, Swing Shift, and Graveyard Shift) with varying shift durations.
    *   Scheduling constraints such as weekly hour limits and honoring approved time-off requests.
    *   Integration with existing employee management or scheduling software to facilitate data input like availability, preferences, and time-off requests.
    *   A formal overtime approval process for work hours exceeding 40 per week.

**Out-of-Scope:**

*   Building mobile applications or interfaces outside of the core scheduling dashboard.
*   Handling non-scheduling HR functions such as payroll or benefits management.
*   Incorporating seasonal staffing changes beyond monitoring for unexpected spikes; the staffing levels remain constant.
*   Full automation of shift swaps without managerial oversight, as manual intervention may be required in emergencies.

## 3. User Flow

Managers and employees will each have a simple, streamlined journey when using the scheduling system. A new manager logs into the system and is greeted with a dashboard displaying current staffing levels, upcoming shifts, and any pending overtime or time-off requests. From the dashboard, the manager can access the scheduling module where they can set or adjust staffing levels, modify shift patterns (Pattern A and Pattern B), handle approvals, and make real-time changes during emergencies. The integration with the existing employee management software ensures that all updates on employee availability, preferences, and times requested off are automatically reflected in the scheduling view.

On the employee side, users log in to their personal dashboard to view their assigned shifts and upcoming schedules. They have the ability to submit requests for time off, update their shift preferences, and even volunteer for additional shifts or swap schedules with a colleague, subject to managerial approval. When emergencies or last-minute scheduling changes occur, designated on-call staff are notified and can easily update their availability. Overall, the system maintains a transparent view for everyone involved, ensuring that both managers and employees can easily navigate the scheduling process with minimal training.

## 4. Core Features (Bullet Points)

*   **Shift Scheduling Module:**

    *   Create schedules for four key periods with defined minimum staffing levels and required supervisor presence.
    *   Support for both Pattern A (four consecutive 10-hour shifts) and Pattern B (three consecutive 12-hour shifts plus one 4-hour shift).

*   **Employee Shift Options:**

    *   Enable selection among Day Shift Early, Day Shift, Swing Shift, and Graveyard Shift with customizable shift durations.

*   **Time-Off Management:**

    *   Allow employees to submit time-off requests, with approval and pending statuses clearly visible.
    *   Ensure approved requests are honored while balancing overall staffing needs.

*   **Overtime Approval Process:**

    *   Include a formal process for requesting and approving overtime when employees exceed 40 hours per week.

*   **On-Call and Emergency Handling:**

    *   An on-call system designating specific backup staff to cover last-minute shifts and emergencies.

*   **Reporting and Metrics:**

    *   Built-in reporting for KPIs such as Coverage Ratio, Overtime Hours, Supervisor Coverage, and Employee Satisfaction.

## 5. Tech Stack & Tools

*   **Frontend Framework:**

    *   Built with a modern JavaScript frameworks React and Nextjs 14 (App Router) with typescript for creating a dynamic dashboard and interactive UI.

*   **Backend Framework:**

    *   NextJs 14 App Router to handle server-side logic, scheduling algorithms, and integration with external systems.

*   **Database:**

    *   A relational database Supabase to manage employee data, scheduling records, and system logs securely.

*   **IDE/Plugins:**

    *   Cursor, an AI-powered IDE for coding with real-time suggestions, which will help in maintaining coding standards and productivity.

*   **AI/Optimization Libraries:**

    *   Optional use of libraries or AI models (e.g., GPT-4o) to assist in optimizing the schedule and managing data predictions or analytics.

## 6. Non-Functional Requirements

*   **Performance:**

    *   Ensure the scheduling system responds quickly within a few seconds for dashboard loads and real-time updates, even under heavy loads.

*   **Security:**

    *   Protect sensitive employee data via encryption both at rest and in transit.
    *   Implement authentication and authorization measures to prevent unauthorized access.

*   **Compliance:**

    *   Adhere to relevant labor laws, overtime regulations, and workplace safety standards (FLSA, OSHA guidelines, etc.).
    *   Ensure data handling complies with internal policies and any applicable state or federal regulations.

*   **Usability:**

    *   Maintain an intuitive interface that is easy for both managers and employees to navigate.
    *   Provide clear prompts, notifications, and help guides within the system.

*   **Reliability:**

    *   Aim for high system availability, especially given the 24/7 need of a dispatch center.
    *   Ensure backup mechanisms and error handling strategies are in place for emergencies and last-minute changes.

## 7. Constraints & Assumptions

*   **Constraints:**

*   The system should limit employees to 40-hour work weeks unless an overtime approval is obtained.

*   Developer reliance on AI-powered coding suggestions via Cursor may be required.

*   **Assumptions:**

    *   Employee data such as availability, preferences, and time-off requests are maintained in an existing employee management system.
    *   Seasonal staffing demand changes are minimal; the scheduling requirements remain relatively constant year-round.
    *   Supervisors and managers have sufficient training to use the system effectively.
    *   The system will run in an environment that supports modern web technologies and necessary integrations.

## 8. Known Issues & Potential Pitfalls

*   **Data Synchronization:**

    *   Ensuring real-time and accurate synchronization of employee data, shift updates, and time-off requests.
    *   Mitigation: Implement robust data validation and periodic synchronization checks.

*   **Overtime Approval Complexity:**

    *   Managing the overtime request process fairly might be challenging, especially during busy periods.
    *   Mitigation: Establish clear rules for overtime approval and automate as much of the workflow as possible while retaining necessary managerial oversight.

*   **User Adoption and Training:**

    *   Resistance or confusion among staff when transitioning to the new scheduling system.
    *   Mitigation: Conduct thorough training sessions and provide ongoing support and documentation.

*   **System Downtime:**

    *   Unplanned system downtime could affect scheduling and staffing, which is a critical risk.
    *   Mitigation: Ensure reliable hosting, proper backup systems, and clear contingency plans for emergencies.

This PRD serves as the main reference for all subsequent engineering and design documents. Each section provides the necessary details to ensure that the AI model or any subsequent developer has a clear, comprehensive understanding of the system's requirements, limitations, and intended functionality.
