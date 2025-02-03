# Actionable Implementation Plan for the 911 Dispatch Center Scheduling System

This document outlines a step-by-step plan for setting up the development environment, building frontend and backend components, integrating the system, and deploying the application. Follow each phase’s tasks in order, and verify functionality at every stage.

---

## Phase 1: Environment Setup

1. **Node.js & Project Initialization**  
   - **Action:** Verify Node.js installation  
     - Command: `node -v`
   - **Action:** Create a new Next.js 14 project with TypeScript  
     - Command: `npx create-next-app@latest --ts`
   - **Action:** Set up a Git repository and create branches `main` and `dev`  
     - Commands:
       - `git init`
       - `git checkout -b main`
       - `git checkout -b dev`

2. **Install Dependencies**  
   - **Supabase Clients:**  
     - Client-side: `npm install @supabase/supabase-js`  
     - Server-side: `npm install @supabase/ssr`
   - **UI Toolkit (Shadcn):**  
     - Command: `npx shadcn@latest init`  
       *(Remember: Use `shadcn` without the deprecated `-ui` suffix.)*
     
3. **Validation:**  
   - **Action:** Start the development server  
     - Command: `npm run dev`  
   - **Result:** Verify that the default Next.js app loads without errors.

---

## Phase 2: Frontend Development

1. **Manager Dashboard Component**  
   - **Path:** `app/(dashboard)/ManagerDashboard/page.tsx`  
   - **Action:** Develop a dashboard view displaying:
     - Current staffing levels
     - Pending time-off requests
     - Overtime approvals

2. **Employee Dashboard Component**  
   - **Path:** `app/(dashboard)/EmployeeDashboard/page.tsx`  
   - **Action:** Build a dashboard for employees to:
     - View assigned shifts
     - Submit time-off requests
     - Update availability

3. **Shared Schedule Viewer Component**  
   - **Path:** `components/ScheduleViewer.tsx`  
   - **Action:**  
     - Display shift details organized by defined time periods (e.g., 5–9 AM, 9 AM–9 PM, etc.)
     - Highlight designated supervisor assignments

4. **UI Controls for Shift Selection**  
   - **Action:** Within `components/ScheduleViewer.tsx`, add controls (buttons or dropdowns) for:
     - Day Shift Early
     - Day Shift
     - Swing Shift
     - Graveyard Shift

5. **Testing the Frontend**  
   - **Action:** Run `npm run dev`  
   - **Result:** Access `/dashboard/manager` and `/dashboard/employee` to ensure components render and interact correctly.

---

## Phase 3: Backend Development

1. **Supabase Client Initialization**  
   - **Path:** `lib/supabaseClient.ts`  
   - **Action:**  
     - Initialize the Supabase client using environment variables.
     
2. **Scheduling Logic Implementation**  
   - **Path:** `lib/scheduler.ts`  
   - **Action:**  
     - Implement functions to generate schedules for two patterns:
       - **Pattern A:** Four consecutive 10-hour shifts.
       - **Pattern B:** Three consecutive 12-hour shifts plus one 4-hour shift.

3. **Schedule API Endpoint**  
   - **Path:** `app/api/schedule/route.ts`  
   - **Action:**  
     - Create a POST endpoint to submit scheduling changes and trigger schedule regeneration.

4. **Time-Off Requests API Endpoint**  
   - **Path:** `app/api/timeoff/route.ts`  
   - **Action:**  
     - Build a POST endpoint to process time-off requests (create, approve, or reject).

5. **Overtime Approval API Endpoint**  
   - **Path:** `app/api/overtime/route.ts`  
   - **Action:**  
     - Develop a POST endpoint to manage overtime requests and the approval workflow.

6. **Testing API Endpoints**  
   - **Action:** Use Postman or `curl` (e.g., `curl -X POST http://localhost:3000/api/schedule`) to verify that all endpoints return a `200 OK` response and correctly process payloads.

---

## Phase 4: Integration

1. **Integrate Manager Dashboard with API**  
   - **Path:** `app/(dashboard)/ManagerDashboard/page.tsx`  
   - **Action:**  
     - Connect to the `/api/schedule` endpoint (using `fetch` or Axios) to update staffing information upon scheduling changes.
   
2. **Integrate Employee Dashboard with Supabase**  
   - **Path:** `app/(dashboard)/EmployeeDashboard/page.tsx`  
   - **Action:**  
     - Fetch and update employee data (shift availability and time-off requests) through the Supabase client.

3. **Dashboard Routing Configuration**  
   - **Action:**  
     - Define clear routing logic to separate manager and employee views. Use route groups if necessary.

4. **Final Data Synchronization Validation**  
   - **Action:**  
     - Test that any change made via the Manager Dashboard is immediately reflected on the Employee Dashboard.

---

## Phase 5: Deployment

1. **Configuration for Production Deployment**  
   - **Action:**  
     - Create a `vercel.json` (or other hosting configuration) file.
     - Include necessary environment variables (e.g., Supabase keys).

2. **Build Production Assets**  
   - **Action:**  
     - Run `npm run build` followed by `npm start` to confirm production readiness.

3. **Deploy the Application**  
   - **Action:**  
     - Push code to the `main` branch.
     - Deploy using your chosen cloud provider (e.g., Vercel).

4. **Production Validation**  
   - **Action:**  
     - Access the production URL and perform end-to-end tests to ensure all functionalities work as intended.

---

## Phase 6: Post-Launch Activities

1. **Monitoring & Logging**  
   - **Action:**  
     - Integrate tools (e.g., Vercel Analytics, LogRocket) for real-time monitoring and error tracking.

2. **Database Backup Setup**  
   - **Action:**  
     - Configure scheduled backups using Supabase's native tools or an external cron job.

3. **User Training & Documentation**  
   - **Action:**  
     - Prepare comprehensive guides for managers and employees.
     - Schedule training sessions to introduce the system features.

4. **Simulated Critical Scenario Testing**  
   - **Action:**  
     - Run simulations for last-minute schedule changes, overtime approvals, and emergency notifications.
     - Verify that all workflows (including on-call notifications) function correctly.

---

*End of Implementation Plan*  
Ensure you follow each phase sequentially and verify the work at every stage for a smooth project rollout.