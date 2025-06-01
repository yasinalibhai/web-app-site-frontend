# HIPAA-Compliant AI Ophthalmic Image Reading Platform Development Plan

## 1. Overview

This document outlines the step-by-step plan to develop a HIPAA-compliant, AI-enabled ophthalmic image reading web platform. The platform will allow hospital staff to upload ophthalmic images, run AI models for biomarker inference, view results, and download PDF reports. Pharmaceutical companies will have limited, anonymized access to results and site metrics for clinical trials they fund.

The solution will be built using Medplum, with initial development and testing performed locally, followed by self-hosting on AWS. It will leverage Medplum's native Projects, ProjectMemberships, and AccessPolicies for a multi-project membership approach to ensure data segregation and compliance. The Medplum Provider app example will be used as a starting point for frontend development.

## 2. Core Tenets

2.1.   **HIPAA Compliance:** All aspects of design, development, and deployment will prioritize HIPAA security and privacy rules.
2.2.   **Data Segregation:** Each hospital will be a separate Medplum Project, isolating FHIR resources and user administration.
2.3.   **Role-Based Access Control (RBAC):** Granular permissions using Medplum AccessPolicies for different user types (Hospital Staff, Pharma Users, Company Admins).
2.4.   **Scalability & Reliability:** AWS infrastructure will be designed for scalability and high availability (considered from the start, implemented during AWS deployment).
2.5.   **Modularity:** AI model integration will be modular, allowing for the addition of new models over time.

## 3. Prerequisites

3.1.   Familiarity with Medplum architecture and FHIR standards.
3.2.   Expertise in TypeScript, React, Node.js, and PostgreSQL.
3.3.   Understanding of HIPAA technical safeguards.
3.4.   AI models for ophthalmic image analysis (developed or sourced).
3.5.   Local development environment capable of running Docker, Node.js, PostgreSQL, and Redis.
3.6.   AWS Account with appropriate permissions (for later deployment phase).

## 4. Development Plan

### Phase 1: Local Development Environment & Initial Medplum Setup

4.1.  **Local Medplum Stack Setup:**
    4.1.1.   Install Docker and Docker Compose.
    4.1.2.   Clone the Medplum Docker repository (`medplum-docker`).
    4.1.3.   Configure and run Medplum services locally using Docker Compose (Medplum Server, Medplum App, PostgreSQL, Redis).
    4.1.4.   Verify local Medplum instance is accessible and operational.

4.2.  **Initial Local Medplum Configuration:**
    4.2.1.   Access the local Medplum App and create a super-admin user account for your company.
    4.2.2.   Review and configure default Medplum settings for the local environment (e.g., authentication, email settings - can use mock/local mail services).
    4.2.3.   Define any custom `StructureDefinition` or `ValueSet` FHIR resources if required beyond standard FHIR for ophthalmic data.

4.3.  **Project Structure and Access Control Design (Conceptual & Local Implementation):**
    4.3.1.   **Multi-Project Strategy Definition:**
        4.3.1.1.   Establish a clear process for creating a new Medplum `Project` for each participating hospital/site.
    4.3.2.   **AccessPolicy Design:**
        4.3.2.1.   **Hospital Staff:** Full CRUD access to relevant FHIR resources (Patient, Observation, DiagnosticReport, Binary, etc.) *within their assigned Project*.
        4.3.2.2.   **Pharmaceutical Company Users:** Read-only access to specific, de-identified/anonymized FHIR resources. This policy will be highly restrictive.
        4.3.2.3.   **Your Company Admins:** Super-admin privileges across all Projects.
        4.3.2.4.   Design policies utilizing Medplum's AccessPolicy `resource.compartment` and `resource.criteria`.
    4.3.3.   **Local Test Project Setup:**
        4.3.3.1.   Create a few sample `Project` entities in your local Medplum instance to represent different hospitals.
        4.3.3.2.   Create sample users (practitioners, patients) and `ProjectMembership` resources locally to test access control.
        4.3.3.3.   Implement and test the designed `AccessPolicy` resources locally.

### Phase 2: Core Application Development (Local)

4.4.  **Frontend Development (Fork Medplum Provider App for Local Use):**
    4.4.1.   Fork the `medplum-provider` example application from the Medplum GitHub repository.
    4.4.2.   Configure the forked provider app to connect to your *local* Medplum instance.
    4.4.3.   Customize the UI/UX to align with the ophthalmic image platform's branding and workflow requirements.
    4.4.4.   Integrate Medplum React components (`@medplum/react`) for interacting with the local Medplum API.
    4.4.5.   Set up routing, navigation, and a dashboard tailored to hospital users, tested against the local Medplum instance.

4.5.  **Patient Management & EHR Search (Local):**
    4.5.1.   Implement functionality for hospital staff to search for patients within their Medplum Project (on the local instance).
    4.5.2.   (Optional - Advanced) If exploring EHR integration, mock EHR endpoints or use a sandbox FHIR server locally for initial development.
    4.5.3.   Develop UI for creating new patients and viewing patient demographic data, storing data in the local Medplum instance.
    4.5.4.   Ensure patient data handling adheres to HIPAA minimum necessary principle, even in the local environment.

4.6.  **Image Upload Functionality (Local):**
    4.6.1.   Develop a user-friendly interface for uploading ophthalmic images.
    4.6.2.   Store uploaded images as FHIR `Binary` resources in the local Medplum instance, linked to local `Patient` resources.
    4.6.3.   Implement client-side and server-side validation for image types and sizes (server-side validation will target the local Medplum server).
    4.6.4.   Test with local S3-compatible storage (e.g., MinIO running in Docker) if direct S3 upload capabilities are explored early, or use standard Medplum binary storage initially.

### Phase 3: AI Integration and Workflow (Local / Mocked)

4.7.  **AI Model Integration (Local Development & Mocking):**
    4.7.1.   **AI Model Hosting (Local/Mock):**
        4.7.1.1.   For local development, mock AI model responses or run lightweight versions of AI models locally if feasible (e.g., as Python scripts or simple local services).
        4.7.1.2.   Design the API contract (input/output) for the AI models.
    4.7.2.   **Integration Logic (Medplum Bots or Local Scripts):**
        4.7.2.1.   Develop Medplum Bots (tested against your local Medplum instance) or local scripts/services to:
            4.7.2.1.1.   Trigger upon new image uploads (using local Medplum Subscriptions or manual triggers).
            4.7.2.1.2.   Retrieve image data from the local `Binary` resource.
            4.7.2.1.3.   Preprocess images as required by the AI models (can be simulated).
            4.7.2.1.4.   Invoke the mock/local AI models with the image data.
            4.7.2.1.5.   Receive mock/local inference results.
        4.7.2.2.   Store AI results as structured FHIR resources in the local Medplum instance:
            4.7.2.2.1.   `Observation` for quantitative biomarkers.
            4.7.2.2.2.   `DiagnosticReport` to summarize findings.
            4.7.2.2.3.   New `Binary` resources for segmentation masks or annotated images.
    4.7.3.   **Workflow Orchestration (Local):** Define and test how users trigger AI model execution locally.

4.8.  **Results Visualization and Reporting (Local):**
    4.8.1.   **Frontend Display (Local):**
        4.8.1.1.   Develop React components to visualize AI results based on data from the local Medplum instance.
    4.8.2.   **PDF Report Generation (Local):**
        4.8.2.1.   Implement functionality to generate downloadable PDF reports using local data.
        4.8.2.2.   Use client-side libraries or simple server-side scripts for report generation locally.
    4.8.3.   **Report Storage (Local):** Store generated PDF reports as FHIR `Binary` or `DocumentReference` resources in the local Medplum instance.

### Phase 4: Pharmaceutical Company Portal & Metrics (Local Development)

4.9.  **Pharma User Access and Dashboard (Local Mockup & Design):**
    4.9.1.   **Onboarding and Access (Local Simulation):**
        4.9.1.1.   Simulate onboarding Pharma users to local sample `Project`(s) with appropriate restrictive `AccessPolicy` resources.
    4.9.2.   **Pharma Dashboard (Local Development):**
        4.9.2.1.   Create a dedicated dashboard for Pharma users, fetching data from the local Medplum instance.
        4.9.2.2.   Focus on displaying anonymized/de-identified data structures. Use sample data locally to test this.
    4.9.3.   **De-identification Strategy (Design & Local Prototyping):**
        4.9.3.1.   Design the de-identification mechanism. Prototype using Medplum Bots or scripts on local sample data.

### Phase 5: Administration and Operations (Local Development)

4.10. **Admin Portal for Your Company (Local Development):**
    4.10.1.  Extend the Medplum App or build a separate admin interface, targeting your local Medplum instance.
    4.10.2.  Functionality to include (tested locally):
        4.10.2.1.  Managing Medplum `Project` creation.
        4.10.2.2.  Managing users and their `ProjectMembership` and `AccessPolicy` assignments.
        4.10.2.3.  Simulating monitoring and `AuditEvent` review locally.

### Phase 6: AWS Environment Setup and Initial Deployment

4.11. **Medplum Instance Setup (Self-Hosted on AWS):**
    4.11.1.  **Infrastructure Provisioning (AWS):**
        4.11.1.1.  **Compute:** Set up Amazon EC2 instances (or ECS/EKS) for Medplum Server, Medplum App.
        4.11.1.2.  **Database:** Deploy Amazon RDS for PostgreSQL.
        4.11.1.3.  **Cache:** Deploy Amazon ElastiCache for Redis.
        4.11.1.4.  **Storage:** Configure Amazon S3 for FHIR `Binary` resources, backups, and logs.
        4.11.1.5.  **Networking:** Set up VPC, subnets, security groups, ALB, Route 53.
        4.11.1.6.  **Security:** Implement AWS IAM, KMS, WAF, Shield.
    4.11.2.  **Medplum Stack Deployment (AWS):**
        4.11.2.1.  Deploy the Medplum server and app to the provisioned AWS infrastructure.
        4.11.2.2.  Configure environment variables for AWS services.
    4.11.3.  **Domain and SSL (AWS):** Configure DNS and SSL certificates.
    4.11.4.  **Backup and Disaster Recovery Planning (AWS):** Implement solutions for RDS and S3.

4.12. **Deploying Developed Application to AWS Staging Environment:**
    4.12.1.  Deploy the customized frontend application to an AWS S3/CloudFront or EC2/ECS setup.
    4.12.2.  Configure the frontend to point to the AWS-hosted Medplum API.
    4.12.3.  Deploy Medplum Bots (if used) to the AWS Medplum server.
    4.12.4.  If separate microservices are used for AI, deploy them to AWS (Lambda, Fargate, EC2).
    4.12.5.  Initial data migration/setup for staging environment (e.g., creating test Projects, users).

4.13. **AI Model Hosting and Integration (AWS):**
    4.13.1.  Set up AI model hosting on AWS (SageMaker, EC2 with GPU, etc.).
    4.13.2.  Integrate the Medplum Bots or microservices with the AWS-hosted AI models.
    4.13.3.  Ensure secure communication between Medplum on AWS and AI services on AWS.

### Phase 7: Comprehensive Testing (Staging on AWS)

4.14. **Security and Compliance (AWS Context):**
    4.14.1.  **Audit Trails:** Configure and review `AuditEvent` resources on the AWS-hosted Medplum.
    4.14.2.  **HIPAA Policies & BAAs:** Finalize policies and ensure BAAs are in place with AWS.
    4.14.3.  **Encryption Verification:** Verify data-at-rest and in-transit encryption on AWS.

4.15. **Deployment and CI/CD (Targeting AWS):**
    4.15.1.  Implement/Refine CI/CD pipelines for deploying to AWS staging and production environments.

4.16. **Comprehensive Testing on AWS Staging Environment:**
    4.16.1.  **Unit & Integration Tests:** Re-run in the context of the AWS environment.
    4.16.2.  **End-to-End (E2E) Tests:** Simulate full user workflows on the staging environment.
    4.16.3.  **User Acceptance Testing (UAT):** Involve stakeholders with the staging environment.
    4.16.4.  **Performance and Load Testing:** Test against the AWS infrastructure.
    4.16.5.  **Security Testing (AWS):** Vulnerability scans, penetration testing of the deployed AWS environment.

### Phase 8: Go-Live and Maintenance (Production on AWS)

4.17. **Go-Live (Production Deployment on AWS):**
    4.17.1.  Develop a detailed go-live checklist for AWS production.
    4.17.2.  Plan for production data migration/setup.
    4.17.3.  Provide comprehensive training.
    4.17.4.  Consider a phased rollout to production.
    4.17.5.  Establish support channels.

4.18. **Maintenance and Updates (AWS Production Environment):**
    4.18.1.  **Medplum Updates (AWS):** Regularly update the self-hosted Medplum instance on AWS.
    4.18.2.  **Monitoring (AWS):** Continuously monitor with AWS CloudWatch etc.
    4.18.3.  **Ongoing Support & Bug Fixing.**
    4.18.4.  **Feature Enhancements.**

## 5. Key Medplum Resources to Leverage

5.1.   **`Project`:** For data isolation per hospital.
5.2.   **`ProjectMembership`:** To assign users to hospitals with specific roles/permissions.
5.3.   **`AccessPolicy`:** To define granular access controls for different user roles and ensure HIPAA compliance.
5.4.   **`ClientApplication`:** To manage access for different parts of your application.
5.5.   **`User` and `Practitioner`:** For managing user identities.
5.6.   **`Patient`:** To store patient demographic data.
5.7.   **`Binary`:** For storing ophthalmic images and PDF reports.
5.8.   **`Observation`:** For storing structured AI model outputs (biomarkers).
5.9.   **`DiagnosticReport`:** For summarizing AI findings.
5.10.  **`Bot`:** For server-side logic, AI integration, and custom workflows.
5.11.  **`Subscription`:** To trigger Bots or other actions based on FHIR resource changes.
5.12.  **`AuditEvent`:** For comprehensive audit trails.
5.13.  **Medplum SDK (`@medplum/core`, `@medplum/react`):** For frontend and backend development.

This plan provides a comprehensive roadmap. Remember to adapt it based on specific requirements and discoveries during the development process. Good luck! 