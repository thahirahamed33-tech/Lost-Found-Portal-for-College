# Data Flow Diagram (DFD) - Lost and Found Portal

## Level 0: Context Diagram
The Level 0 context diagram shows the system as a whole and its interactions with external entities.

```mermaid
graph LR
    User([User/Student])
    Admin([College Admin])
    System(Lost & Found Portal)

    User -- "Register/Login" --> System
    User -- "Report Lost/Found Item" --> System
    User -- "Search Items" --> System
    
    System -- "Notifications" --> User
    System -- "Item Matches" --> User

    Admin -- "Manage Items/Users" --> System
    Admin -- "View Stats" --> System
    
    System -- "System Reports" --> Admin
```

---

## Level 1: System Data Flow Diagram
The Level 1 DFD breaks down the system into its primary functional processes and displays data stores.

```mermaid
graph TD
    %% External Entities
    User([User/Student])
    Admin([College Admin])

    %% Processes
    P1[1.0 Auth & Session Management]
    P2[2.0 Lost Item Management]
    P3[3.0 Found Item Management]
    P4[4.0 Notification System]
    P5[5.0 Admin Management]

    %% Data Stores
    D1[(Users Table)]
    D2[(Lost Items Table)]
    D3[(Found Items Table)]
    D4[(Notifications Table)]
    D5[(File System/Uploads)]

    %% Data Flows - Auth
    User -- "Credentials" --> P1
    P1 -- "Verify User" --> D1
    P1 -- "Session Token" --> User

    %% Data Flows - Lost Items
    User -- "Lost Report + Image" --> P2
    P2 -- "Store Info" --> D2
    P2 -- "Store Image" --> D5
    D2 -- "Retrieve Item List" --> P2
    P2 -- "Filtered Items" --> User

    %% Data Flows - Found Items
    User -- "Found Report + Image" --> P3
    P3 -- "Store Info" --> D3
    P3 -- "Store Image" --> D5
    D3 -- "Retrieve Item List" --> P3
    P3 -- "Filtered Items" --> User

    %% Data Flows - Notifications
    P2 -- "Trigger Match Check" --> P4
    P3 -- "Trigger Match Check" --> P4
    P4 -- "Store Message" --> D4
    D4 -- "Retrieve Alerts" --> P4
    P4 -- "Alert Notifications" --> User

    %% Data Flows - Admin
    Admin -- "Management Requests" --> P5
    P5 -- "CRUD Actions" --> D1
    P5 -- "CRUD Actions" --> D2
    P5 -- "CRUD Actions" --> D3
    P5 -- "Stats Calculation" --> P5
    P5 -- "Dashboard Overviews" --> Admin
```

### Key Data Flows Explained:
1.  **Item Match Processing**: When a lost item is reported (P2), the system checks existing found items (D3). If a match is found, a record is added to the Notifications Table (D4).
2.  **Image Uploads**: Any item reports including images flow into the file system (D5), with corresponding URL paths stored in D2 or D3.
3.  **Unified Search**: Both P2 and P3 read from their respective data stores to provide users with searchable lists of current items.
4.  **Admin Oversight**: Admin processes (P5) have full read/write access to all database tables (D1-D4) for moderation and management.
