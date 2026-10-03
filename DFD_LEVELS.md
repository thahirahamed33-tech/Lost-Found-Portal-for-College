# Mermaid Data Flow Diagrams (Level 1 & 2)

## Level 1 DFD: System Functional Decomposition
This level breaks the "Lost & Found Portal" into main functional processes.

```mermaid
graph TD
    %% External Entities
    U[User]
    A[Admin]

    %% Processes
    P1[1.0 Authenticate User]
    P2[2.0 Report Item]
    P3[3.0 Search & Match]
    P4[4.0 Notification System]
    P5[5.0 Admin Management]

    %% Data Stores
    D1[(Users DB)]
    D2[(Items DB)]
    D3[(Notifications DB)]
    D4[(Uploads folder)]

    %% Connections
    U -- "Credentials" --> P1
    P1 -- "Verify" --> D1
    P1 -- "Session Response" --> U

    U -- "Report Data + Image" --> P2
    P2 -- "Store Info" --> D2
    P2 -- "Store Image" --> D4
    P2 -- "Confirmation" --> U

    U -- "Search Query" --> P3
    P3 -- "Query Items" --> D2
    D2 -- "Results" --> P3
    P3 -- "Display Items" --> U
    P3 -- "Trigger Notification" --> P4

    P4 -- "Create Alert" --> D3
    D3 -- "Fetch Alerts" --> P4
    P4 -- "Alert User" --> U

    A -- "Manage Request" --> P5
    P5 -- "CRUD" --> D1
    P5 -- "CRUD" --> D2
    P5 -- "Status Update" --> A
```

---

## Level 2 DFD: Detailed "Report Item" Process (2.0)
This level expands the **2.0 Report Item** process from Level 1.

```mermaid
graph TD
    %% External Entity
    U[User]

    %% Sub-Processes
    P2_1[2.1 Receive & Sanitize FormData]
    P2_2[2.2 Handle Image Upload]
    P2_3[2.3 Data Validation]
    P2_4[2.4 Save to Database]

    %% Data Stores
    D1[(Items DB)]
    D2[(Uploads Folder)]

    %% Data Flows
    U -- "Submit Item Report" --> P2_1
    P2_1 -- "Raw Data" --> P2_3
    P2_1 -- "Binary Stream" --> P2_2
    
    P2_2 -- "Storage Status/Path" --> P2_4
    P2_2 -- "Save local file" --> D2
    
    P2_3 -- "Validated Metadata" --> P2_4
    P2_3 -- "Errors" --> U

    P2_4 -- "Execute INSERT query" --> D1
    D1 -- "Success Response" --> P2_4
    P2_4 -- "Success Message" --> U
```

---

## Level 2 DFD: Detailed "Search & Match" Process (3.0)
This level expands the **3.0 Search & Match** process from Level 1.

```mermaid
graph TD
    %% External Entity
    U[User]

    %% Sub-Processes
    P3_1[3.1 Process Search Query]
    P3_2[3.2 Execute SQL Keyword Match]
    P3_3[3.3 Compare Lost/Found Records]
    P3_4[3.4 Format Result Views]

    %% Data Stores
    D1[(Items DB)]
    D2[(Notifications DB)]

    %% Data Flows
    U -- "Keywords/Filters" --> P3_1
    P3_1 -- "Structured Params" --> P3_2
    
    P3_2 -- "Query DB" --> D1
    D1 -- "Rows Returned" --> P3_2
    
    P3_2 -- "Item List" --> P3_4
    P3_2 -- "Trigger Automatic Matcher" --> P3_3
    
    P3_3 -- "Check Correlations" --> D1
    P3_3 -- "Potential Matches Found" --> D2
    
    P3_4 -- "Rendered HTML/JSON" --> U
```
