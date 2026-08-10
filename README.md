# Fleet Intelligence 360 (FI360)

## Standalone but Connectable Fleet Intelligence Ecosystem

Fleet Intelligence 360 (FI360) is a modular fleet, asset and transport intelligence platform designed around a **Standalone but Connectable** architecture.

Each FI360 module is designed to provide meaningful functionality independently while being capable of connecting to other FI360 modules and external systems through standardized APIs and integration contracts.

FI360 is intended to provide organizations with flexible fleet management capabilities without requiring every module to be deployed as a single tightly coupled system.

---

# 1. FI360 Product Vision

FI360 aims to transform fleet and asset management from fragmented operational processes into an integrated, data-driven intelligence ecosystem.

The platform is designed to support organizations in managing:

- Vehicles
- Equipment
- Drivers
- Maintenance
- Workshops
- Tyres
- Fuel
- Inspections
- Transport operations
- Fleet costs
- Compliance
- Telematics
- Analytics
- Fleet intelligence

The long-term objective is to provide a scalable ecosystem where organizations can deploy only the capabilities they need and progressively connect additional FI360 modules as their requirements grow.

---

# 2. Core Architecture Principle

## STANDALONE BUT CONNECTABLE

The fundamental FI360 architecture principle is:

> **Every FI360 module should be capable of operating independently while being designed for secure and controlled connectivity with other FI360 modules and external systems.**

This means FI360 is not designed as a single tightly coupled application.

Instead, FI360 is an ecosystem of interoperable modules.

### Standalone

A customer may deploy an individual FI360 capability independently.

For example:

```text
FI360 Tyre Management
may operate without requiring:
FI360 Workshop
FI360 Fuel
FI360 Driver

Connectable

When required, the same module can connect with other FI360 modules.

For example:

FI360 Tyre
      │
      │ API
      ▼
FI360 Fleet
      │
      │ API
      ▼
FI360 Workshop

The modules communicate through defined interfaces rather than unnecessary direct dependencies.

3. Architectural Principles

FI360 development will follow the following principles:

3.1 Module Independence

Each major FI360 module should have clearly defined responsibilities and should be capable of providing meaningful functionality independently.

3.2 Controlled Connectivity

Modules communicate through standardized APIs, integration contracts and defined data interfaces.

3.3 Clear Data Ownership

Each module owns the business data required for its primary responsibility.

Other modules should access that information through approved interfaces rather than uncontrolled database dependencies.

3.4 API-First Design

Module interfaces will be designed around documented APIs and integration contracts.

3.5 Loose Coupling

Modules should avoid unnecessary technical dependencies on other modules.

3.6 Scalability

Individual modules should be capable of scaling according to operational requirements.

3.7 Security by Design

Authentication, authorization, tenant isolation, auditing and secure integration will be incorporated into the architecture from the beginning.

3.8 Auditability

Important business and system actions should be traceable.

3.9 Documentation-Driven Development

Architecture, requirements, APIs, database structures and integration contracts will be documented before or alongside implementation.

4. FI360 Module Ecosystem

The initial FI360 ecosystem is expected to include:

FI360 ECOSYSTEM

├── Fleet Management
├── Vehicle Management
├── Driver Management
├── Workshop Management
├── Maintenance Management
├── Tyre Management
├── Fuel Management
├── Inspection & Compliance
├── Transport Operations
├── Cost Management
├── Telematics Integration
├── Analytics & Intelligence
└── Administration & Security

These modules will be developed with clearly defined boundaries.

5. Major FI360 Modules
5.1 Fleet Management

Responsible for core fleet and vehicle information.

Potential capabilities:

Fleet register
Vehicle master
Asset register
Vehicle classification
Vehicle status
Ownership
Allocation
Organizational structure
5.2 Driver Management

Responsible for driver-related information and driver operational management.

Potential capabilities:

Driver register
Driver profiles
Licence information
Driver allocation
Driver compliance
Driver performance
Driver history
5.3 Workshop & Maintenance Management

Responsible for workshop and maintenance operations.

Potential capabilities:

Work orders
Preventive maintenance
Corrective maintenance
Workshop operations
Maintenance scheduling
Labour
Parts
Maintenance history
Maintenance costs
5.4 Tyre Management

Responsible for tyre lifecycle management.

Potential capabilities:

Tyre register
Tyre identification
Tyre fitment
Tyre removal
Tyre rotation
Tyre inspection
Tread monitoring
Tyre lifecycle
Tyre costs
Tyre performance
5.5 Fuel Management

Responsible for fuel control and fuel intelligence.

Potential capabilities:

Fuel transactions
Fuel records
Fuel cards
Fuel suppliers
Fuel reconciliation
Fuel consumption
Fuel efficiency
Fuel cost analysis
5.6 Inspection & Compliance

Responsible for inspections, defects and compliance.

Potential capabilities:

Vehicle inspections
Safety inspections
Defect reporting
Defect resolution
Compliance records
Regulatory monitoring
Inspection history
5.7 Transport Operations

Responsible for transport execution and operational control.

Potential capabilities:

Trip planning
Trip allocation
Dispatch
Journey management
Transport scheduling
Transport performance
Journey records
5.8 Cost Management

Responsible for fleet financial and operational cost intelligence.

Potential capabilities:

Operating costs
Maintenance costs
Fuel costs
Tyre costs
Labour costs
Cost per kilometre
Cost per vehicle
Total cost of ownership
5.9 Telematics & Integration

Responsible for connectivity with external systems and data sources.

Potential integrations may include:

GPS
Telematics
Fuel systems
ERP systems
Accounting systems
Payment platforms
External APIs
IoT systems
5.10 Fleet Intelligence & Analytics

Responsible for turning operational data into management intelligence.

Potential capabilities:

KPI dashboards
Fleet performance
Vehicle utilization
Availability
Reliability
Maintenance intelligence
Cost intelligence
Fuel intelligence
Tyre intelligence
Predictive analytics
6. Module Connectivity

FI360 modules should connect through controlled interfaces.

Example:

              FI360 API / Integration Layer

                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
     Fleet          Workshop           Tyre
       │               │                │
       ▼               ▼                ▼
     Vehicle        Maintenance       Tyre
     Data           Data              Data

A module should only request the information it requires.

For example, the Tyre module may require a vehicle identifier from Fleet Management without becoming dependent on the entire Fleet Management implementation.

7. External Connectivity

FI360 should also be capable of connecting to systems outside the FI360 ecosystem.

Examples include:

External System
       │
       ▼
FI360 API / Integration Layer
       │
       ├── Fleet
       ├── Workshop
       ├── Tyre
       ├── Fuel
       └── Analytics

This allows FI360 to coexist with existing enterprise systems rather than requiring organizations to replace all existing systems.

8. Database Architecture

PostgreSQL is the core relational database technology selected for FI360.

The database architecture will follow the same Standalone but Connectable principle.

Each module will have clearly defined data ownership.

Example:

Fleet Module
    │
    └── Owns fleet and vehicle master data

Workshop Module
    │
    └── Owns maintenance and work-order data

Tyre Module
    │
    └── Owns tyre lifecycle data

Fuel Module
    │
    └── Owns fuel transaction data

Modules should avoid uncontrolled direct dependencies on another module's database structures.

Database architecture will be finalized during the database design phase.

9. Technology Architecture

FI360 will use a modular, API-first architecture.

Layer	Technology / Approach
Database	PostgreSQL
Backend	To be finalized
Frontend	To be finalized
API	API-first
Integration	REST/API contracts and future event-based integration where appropriate
Authentication	To be finalized
Analytics	To be finalized
Deployment	To be finalized
Source Control	Git / GitHub

Technology decisions will be documented before implementation.

10. Repository Structure

The repository will progressively evolve toward a modular structure.

fleet-intelligence-360/
│
├── README.md
│
├── docs/
│
├── modules/
│   ├── fleet/
│   ├── driver/
│   ├── workshop/
│   ├── maintenance/
│   ├── tyre/
│   ├── fuel/
│   ├── inspection/
│   ├── transport/
│   ├── cost/
│   └── intelligence/
│
├── platform/
│   ├── identity/
│   ├── authorization/
│   ├── audit/
│   └── integration/
│
├── api/
│
├── database/
│
├── frontend/
│
├── integrations/
│
├── tests/
│
└── deployment/

The final structure may evolve as the architecture is implemented.

11. Documentation

FI360 development is supported by controlled technical and business documentation.

Documentation categories include:

Product requirements
Business processes
System architecture
Functional specifications
Database architecture
API contracts
Integration contracts
Security requirements
Testing requirements
Deployment requirements

Documentation will be maintained within the /docs directory.

12. Development Workflow

FI360 development will follow a controlled workflow:

Requirement
     ↓
Specification
     ↓
GitHub Issue
     ↓
FI360 Project Backlog
     ↓
Module
     ↓
Development Task
     ↓
Feature Branch
     ↓
Development
     ↓
Testing
     ↓
Pull Request
     ↓
Code Review
     ↓
Merge
     ↓
Release

The main branch will represent stable code.

Development work should be performed through controlled branches and pull requests.

13. Testing Philosophy

Each FI360 module should be testable independently.

Testing will progressively include:

Unit testing
Module testing
API testing
Integration testing
Database testing
Security testing
Performance testing
User acceptance testing

Where modules connect, integration testing will verify that the defined contracts are respected.

14. Security

Security will be incorporated throughout the FI360 architecture.

Key areas include:

Authentication
Authorization
Role-based access control
Tenant isolation
Data validation
API security
Audit trails
Encryption
Secrets management
Backup and recovery
Access logging

Security requirements will be refined during implementation.

15. Project Management

FI360 development is managed through the GitHub Project:

Fleet Intelligence 360 (FI360)

The Project will be used for:

Product backlog
Module backlog
Sprint planning
Roadmap management
Feature tracking
Bug tracking
Development tasks
Release planning
16. Development Status

Current Phase: Development Foundation

Current priorities:

Establish GitHub development environment.
Establish FI360 modular architecture.
Organize FI360 documentation.
Define module boundaries.
Define module data ownership.
Define API and integration boundaries.
Establish PostgreSQL architecture.
Establish development standards.
Develop the first FI360 module.
Establish module integration patterns.
17. Versioning

FI360 will use controlled software versioning.

Current development version:

v0.1.0 – Development Foundation

Versioning will evolve as FI360 progresses toward production releases.

18. Project Status
Area	Status
Product vision	Established
Standalone-but-connectable principle	Established
Business processes	Established
Architecture documentation	Established
API documentation	In development
Module boundaries	Being formalized
Database architecture	Next
Backend	Pending
Frontend	Pending
Integrations	Pending
Testing framework	Pending
Production deployment	Pending
19. Intellectual Property

FI360 is a proprietary software product under development.

The repository is currently maintained as a private development repository.

Access to the repository should be controlled according to project and development requirements.

20. Development Notice

FI360 is currently under active development.

Architecture, technology choices, interfaces and implementation details may evolve as the platform is developed and tested.

This repository should not currently be considered a production release.


---

# 2.3 Why this README is different

Notice that we have deliberately changed the architecture from the earlier version.

The key statement is:

> **"FI360 is an ecosystem of interoperable modules rather than a single tightly coupled application."**

That should guide **everything we do from now on**.

For example, we will not automatically assume:

```text
Tyre → directly accesses Workshop tables

Instead, we will design:

Tyre
  ↓
defined interface/API
  ↓
Workshop

when such connectivity is actually required.
