# Begin step 4.3.1
_Exported on 5/31/2025 at 12:39:18 EDT from Cursor (0.50.7)_

---

**User**

Lets begin step 4.3.1

---

**Cursor**

Okay, we are now at **Step 4.3.1. Multi-Project Strategy Definition**, and specifically **4.3.1.1. Establish a clear process for creating a new Medplum `Project` for each participating hospital/site.**

You've confirmed that the concept of one Medplum `Project` per hospital makes sense for data isolation. Now, let's define the *process* for creating these projects using the Medplum admin app you're currently logged into via Puppeteer.

The general process will be:
1.  As an administrator (which you are, currently logged in), navigate to the section of the Medplum app where `Project` resources are managed.
2.  Use the "Create" or "New" functionality to define a new `Project`.
3.  Provide the necessary details for the project (e.g., a name representing the hospital).

To make this concrete, I will use the Puppeteer session to navigate to where `Project` resources are typically managed. This is often under an "Admin" section or a dedicated "Projects" tab.

First, I'll take a screenshot of the current page (which should be the dashboard or a similar landing page after login) to see the navigation options.

I've taken a screenshot named `dashboard_overview_for_projects_link`. Please examine it.

Based on typical Medplum layouts, I'll look for a link or menu item like "Projects," "Admin," or "Project Admin" in the sidebar or main navigation.

Could you look at the screenshot `dashboard_overview_for_projects_link` and tell me if you see an obvious link for "Projects" or an "Admin" section that might contain project management? If so, what is the text of that link? This will help me navigate correctly.

---

**User**

where is the screenshot

---

**Cursor**

My apologies. When I use the Puppeteer tool to take a screenshot, it's saved on the system running the Puppeteer server, and typically you would be able to view it through the interface that's managing the Puppeteer session (MCP).

Since I can't directly display the image to you here in our chat, could you please describe the main navigation options you see on the page you're currently viewing in your browser (the Medplum admin app at `http://localhost:3000`) after I logged in?

Specifically, look for items in a sidebar or top navigation menu that might relate to managing projects. Common labels are:
*   "Projects"
*   "Admin" (which might then have a sub-menu for "Projects")
*   "Project Admin"
*   Sometimes, if you're a super-admin, you might already be in a default project context, and there might be an option to switch or manage projects.

Once you describe what you see, I can guide the Puppeteer tool to click on the correct link.

---

**User**

There is a super admin section on the left hand side panel. Under it there is a link to Projects. when clicked, this shows us the current projects (there are 2 currently; one called Super Admin and one called FHIR R4)

---

**Cursor**

Excellent, that's very clear!

So, the navigation path is: **Super Admin -> Projects**.

I will now try to click the "Projects" link within the "Super Admin" section using Puppeteer. Since I don't have the exact selector for the "Projects" link, I'll make an informed guess. A common way to select links is by their text content. I'll try to find a link with the text "Projects" within an element that might represent the "Super Admin" section.

I will assume the "Projects" link is an `<a>` tag. If this click doesn't work, we might need a more specific selector.

I have clicked what I believe is the "Projects" link under "Super Admin". You should now see the page listing the existing projects (Super Admin and FHIR R4).

To confirm and to identify how to create a new project, I'll take a screenshot of this "Projects" page.

I've taken a screenshot named `projects_list_page`.

Now, please look at this page (or the screenshot if you can access it via your Puppeteer server). You should see the list of projects. More importantly, look for a button or link that allows you to **create a new project**. This might be labeled:
*   "New Project"
*   "Create Project"
*   "Add Project"
*   A "+" icon

Once you find it, tell me what it's labeled. This will complete **Step 4.3.1.1. Establish a clear process for creating a new Medplum `Project` for each participating hospital/site.**

The process would then be:
1.  Navigate to Super Admin -> Projects.
2.  Click the "[Button/Link Name for Creating a New Project]".
3.  Fill in the required details for the new project (e.g., Project Name).
4.  Save the new project.

---

**User**

There is a button called "New...". When clicked, it opens a form that allows me to create a new Project Resource

---

**Cursor**

Perfect!

So, the clear process for creating a new Medplum `Project` for each participating hospital/site is:
1.  As a super-admin, navigate to the "Super Admin" section in the left-hand side panel.
2.  Click on the "Projects" link.
3.  On the Projects page, click the "New..." button.
4.  This will open a form to create a new `Project` resource. Fill in the details for the new hospital project (e.g., its name).
5.  Save the new project.

This completes **Step 4.3.1.1. Establish a clear process for creating a new Medplum `Project` for each participating hospital/site.**

Now we move to **Step 4.3.2. AccessPolicy Design.** This is a conceptual step where we'll define the permissions for different user roles before actually creating the `AccessPolicy` resources in the system.

The first role to design for is:
**4.3.2.1. Hospital Staff: Full CRUD (Create, Read, Update, Delete) access to relevant FHIR resources (Patient, Observation, DiagnosticReport, Binary, etc.) *within their assigned Project*.**

Let's break down what this means for an `AccessPolicy` for Hospital Staff:

*   **Scope:** The policy will apply to users who are members of a specific hospital's `Project`.
*   **Resources:** They need access to key clinical and administrative resources. The list in the plan is a good starting point:
    *   `Patient` (for managing patient demographics)
    *   `Observation` (for AI results, vital signs, etc.)
    *   `DiagnosticReport` (for summarized reports)
    *   `Binary` (for storing images and PDF reports)
    *   You might also consider: `ServiceRequest` (to represent an order for an AI analysis), `Encounter` (if interactions need to be tracked as encounters), `Practitioner` (for users if they are also represented as FHIR Practitioners), `Organization` (to represent the hospital itself within its project).
*   **Permissions:** "Full CRUD" means they should be able to `read`, `write` (which covers create and update), and `delete` these resources.
*   **Compartment Constraint:** Crucially, their access *must* be confined to resources that belong to *their assigned hospital's Project*. Medplum's `AccessPolicy` resource has mechanisms for this, often using `compartment.project` or similar criteria. This ensures they cannot access data from other hospitals.

**Action for this step:**
Think about any other FHIR resources hospital staff might need access to for the ophthalmic imaging workflow. For example, if they need to manage appointments or schedules related to imaging, they might need access to `Slot` or `Appointment` resources.

For now, we are just defining the *requirements* for this AccessPolicy. We'll implement it as a FHIR `AccessPolicy` resource in a later step (4.3.3.3).

Do you have any other FHIR resource types in mind that hospital staff should have full CRUD access to within their project, based on the platform's goals?

---

**User**

They will need access to encounter, practitioner and organization resources

---

**Cursor**

Excellent additions. So, for **Step 4.3.2.1. Hospital Staff AccessPolicy Design**, the requirements are:

*   **Role:** Hospital Staff
*   **Scope:** Within their assigned hospital `Project`.
*   **Permissions:** Full CRUD (Create, Read, Update, Delete)
*   **FHIR Resources:**
    *   `Patient`
    *   `Observation`
    *   `DiagnosticReport`
    *   `Binary`
    *   `ServiceRequest` (added for clarity, as it's often part of such workflows)
    *   `Encounter` (your addition)
    *   `Practitioner` (your addition - for managing staff user profiles if linked to Practitioner resources)
    *   `Organization` (your addition - to manage details of their own hospital/clinic if needed within their project)
*   **Constraint:** Access strictly limited to resources within their own `Project`.

This looks like a comprehensive list for hospital staff.

Next, let's define the requirements for **Step 4.3.2.2. Pharmaceutical Company Users: Read-only access to specific, de-identified/anonymized FHIR resources. This policy will be highly restrictive.**

Let's break this down:
*   **Role:** Pharmaceutical Company User
*   **Scope:** They might be members of multiple hospital `Project`s, but their view into each project is restricted by this policy.
*   **Permissions:** Strictly `read-only`. No create, update, or delete capabilities for any resource they can see.
*   **FHIR Resources (and De-identification):**
    *   `Observation`: For AI results (e.g., biomarker values). These would need to be de-identified – meaning any link back to a specific `Patient` must be removed or obfuscated.
    *   `DiagnosticReport`: For summarized AI findings, also de-identified.
    *   `Binary`: Perhaps for de-identified reports or aggregated visual data, but direct access to images that might contain PHI (even if the `Patient` link is removed) is risky and needs careful consideration. It might be safer to provide derivative `Binary` resources (e.g., anonymized PDFs).
    *   Possibly aggregated data from other resources, but *never* direct `Patient` resource access unless it's a purely aggregated, de-identified count or summary.
*   **Key Constraints:**
    *   **De-identification:** This is the most critical part. The `AccessPolicy` itself, or Medplum Bots acting as an intermediary, must ensure that any data presented to Pharma users is properly de-identified according to HIPAA Safe Harbor or Expert Determination methods. This might involve stripping direct identifiers, obfuscating dates, generalizing locations, etc.
    *   **Limited Fields:** Even for allowed resources, they should only see a minimal set of fields necessary for their purpose (e.g., just the biomarker value and type from an `Observation`, not necessarily its full history or associated encounter details).
    *   Access strictly limited to resources within the `Project`(s) they are granted membership to.

**Action for this step:**
Consider what specific, de-identified data points or aggregated metrics Pharma users would need. For example:
*   Would they see individual (but de-identified) biomarker results?
*   Or only aggregated statistics (e.g., "Site X had 20 positive findings for Biomarker Y this month")?
*   What kind of de-identified reports (`Binary` resources) would be permissible and useful?

The more specific we are now, the better we can design the `AccessPolicy` and any necessary de-identification Bots later. The default should be "deny all" and then we selectively allow specific, de-identified views.

---

**User**

They will need to see both individual biomarker results, and aggregated stats. 

---

**Cursor**

Okay, that helps clarify the needs for **Step 4.3.2.2. Pharmaceutical Company Users AccessPolicy Design**.

Here's a refined summary of the requirements:

*   **Role:** Pharmaceutical Company User
*   **Scope:** Across multiple hospital `Project`(s) they are explicitly granted membership to.
*   **Permissions:** Strictly `read-only`.
*   **FHIR Resources & Data Views:**
    *   **Individual De-identified Results:**
        *   `Observation`: Read-only access to specific fields of de-identified `Observation` resources (e.g., biomarker type, value, unit, effectiveDateTime generalized). Must not link directly to identifiable `Patient` data.
        *   `DiagnosticReport`: Read-only access to de-identified `DiagnosticReport` summaries. Must not link directly to identifiable `Patient` data.
        *   `Binary`: Potentially read-only access to de-identified PDF reports derived from `DiagnosticReport`s or `Observation`s. Access to raw or processed images is highly unlikely unless they are verifiably 100% anonymized.
    *   **Aggregated Statistics:**
        *   The system will need a mechanism (likely Medplum Bots or a separate analytics layer querying Medplum) to generate and store aggregated, de-identified statistics. These could be stored as custom FHIR resources or made available through a dedicated API endpoint. Pharma users would have read-only access to these *aggregated* results. Examples:
            *   Number of images uploaded per site.
            *   Number of AI analyses performed per site.
            *   Distribution of specific biomarker findings (de-identified) per site or across sites.
*   **Key Constraints:**
    *   **Robust De-identification:** Essential for all individual-level data. Must adhere to HIPAA standards. This will likely involve custom logic (e.g., in Medplum Bots) to create de-identified copies or views of data before Pharma users can access it via their restrictive `AccessPolicy`.
    *   **Principle of Minimum Necessary:** Pharma users should only see the absolute minimum data required for their approved use case (clinical trial oversight).
    *   Access to any resource or data point is strictly limited to `Project`(s) they are members of.

This implies that the `AccessPolicy` for Pharma users will be quite complex. It might not grant direct read access to raw `Observation` or `DiagnosticReport` resources if those contain PHI. Instead, it might grant read access to:
1.  Specifically *de-identified copies* of these resources (e.g., an `Observation` that has gone through a de-identification Bot and is tagged as "de-identified").
2.  Custom FHIR resources or API endpoints that expose only pre-aggregated, de-identified data.

This level of detail is good for the design phase.

Next is **Step 4.3.2.3. Your Company Admins: Super-admin privileges across all Projects for system administration, user management, and data oversight.**

This one is more straightforward:
*   **Role:** Your Company Admin (e.g., the `super-admin` account you created).
*   **Scope:** System-wide, across all `Project`s.
*   **Permissions:** Full CRUD on *all* FHIR resources, including administrative resources like `Project`, `User`, `ClientApplication`, `AccessPolicy`, `Bot`, `Subscription`, `AuditEvent`, etc.
*   **Constraints:** Essentially none beyond the inherent capabilities of Medplum. They are the system superusers.

The default "super admin" capabilities in Medplum usually cover this. When you create the first user in a Medplum instance, they typically get these broad permissions. We don't usually need to craft a specific `AccessPolicy` for this role initially, as it's inherent to the super-admin status. However, for any *other* users from your company who might need administrative access but not *full super-admin* rights, you would create specific `AccessPolicy` resources for them.

For the purpose of this step, confirming that your "super-admin" user indeed has these broad privileges is sufficient.

Does this definition for "Your Company Admins" align with your expectations?

---

**User**

yes it does.

However, going back one step, we need to make available the ResearchStudy and ResearchSubject resources to the hospital users. These resources will allow patients to be grouped as particpants of a clinical trial

---

**Cursor**

Excellent point, and thank you for catching that! Access to `ResearchStudy` and `ResearchSubject` is indeed crucial for managing clinical trial participants within the hospital's project.

Let's update the requirements for **Step 4.3.2.1. Hospital Staff AccessPolicy Design** to include these:

*   **Role:** Hospital Staff
*   **Scope:** Within their assigned hospital `Project`.
*   **Permissions:** Full CRUD (Create, Read, Update, Delete)
*   **FHIR Resources:**
    *   `Patient`
    *   `Observation`
    *   `DiagnosticReport`
    *   `Binary`
    *   `ServiceRequest`
    *   `Encounter`
    *   `Practitioner`
    *   `Organization`
    *   **`ResearchStudy`** (your addition - for managing/viewing clinical trials active at their site)
    *   **`ResearchSubject`** (your addition - for enrolling/managing patients as participants in a `ResearchStudy`)
*   **Constraint:** Access strictly limited to resources within their own `Project`.

This makes the Hospital Staff role more complete for the clinical trial context.

Now, let's move to the final part of the design phase for access policies:
**Step 4.3.2.4. Design policies utilizing Medplum's AccessPolicy `resource.compartment` and `resource.criteria`.**

This isn't about a new role, but rather *how* we'll enforce the "within their assigned Project" and other restrictions we've discussed for the Hospital Staff and Pharma Users.

When we create the actual `AccessPolicy` FHIR resources, we will use fields within them like:
*   **`resource.compartment`**: This is a key mechanism. For an `AccessPolicy` assigned to a user within a specific `Project` (e.g., "Hospital A Project"), we can state that the policy only applies to resources that are also in that same project compartment. This is fundamental to data segregation.
    *   For example, for Hospital Staff in "Hospital A Project", their `AccessPolicy` would specify that they can only read/write `Patient` resources where `Patient.meta.project` (or an equivalent compartment identifier) matches "Hospital A Project".
*   **`resource.criteria`**: This allows for more fine-grained control using FHIRpath expressions.
    *   For Pharma Users, if we want to show them only `Observation`s that have been de-identified (perhaps marked with a specific tag or profile), we could use `criteria` to filter for those. E.g., `Observation.meta.tag.where(system='http://your-internal-system/tags' and code='de-identified').exists()`.
    *   We could also use criteria to restrict access to only certain fields within a resource, although this is often more complex and might be better handled by transforming the resource (e.g., via a Bot) before the Pharma user accesses it.
*   **`resource.readonly`**: A simple boolean to make an entire policy read-only, which will be essential for the Pharma User policy.
*   **`resource.resourceType`**: Specifies which FHIR resource types the policy rule applies to.
*   **`resource.access`**: Specifies `read`, `write`, `delete` permissions.

**Conceptual Understanding for this Step:**
The main takeaway here is that Medplum's `AccessPolicy` is powerful enough to enforce the project-based segregation and specific read/write/de-identified data access rules we've designed. We will be leveraging these internal mechanisms of `AccessPolicy` when we implement them.

For example, a snippet of an `AccessPolicy` for Hospital Staff might look conceptually like this (this is not exact JSON, just illustrative):

```
AccessPolicy for HospitalStaff in ProjectX:
  Applies to resourceType: Patient
  Permissions: read, write, delete
  Constraint: resource.meta.project EQUALS ProjectX.id

  Applies to resourceType: Observation
  Permissions: read, write, delete
  Constraint: resource.meta.project EQUALS ProjectX.id
  ...and so on for other resources...
```

And for a Pharma User:
```
AccessPolicy for PharmaUser in ProjectX:
  Applies to resourceType: Observation
  Permissions: read
  Constraint: resource.meta.project EQUALS ProjectX.id
  AND resource.meta.tag CONTAINS 'de-identified' // Via FHIRpath in criteria
  Readonly: true
```

This understanding will guide us in Step 4.3.3.3 when we actually create these `AccessPolicy` resources.

Does this conceptual explanation of how `compartment` and `criteria` will be used make sense?

```plaintext
AccessPolicy for HospitalStaff in ProjectX:
  Applies to resourceType: Patient
  Permissions: read, write, delete
  Constraint: resource.meta.project EQUALS ProjectX.id

  Applies to resourceType: Observation
  Permissions: read, write, delete
  Constraint: resource.meta.project EQUALS ProjectX.id
  ...and so on for other resources...
```

```plaintext
AccessPolicy for PharmaUser in ProjectX:
  Applies to resourceType: Observation
  Permissions: read
  Constraint: resource.meta.project EQUALS ProjectX.id
  AND resource.meta.tag CONTAINS 'de-identified' // Via FHIRpath in criteria
  Readonly: true
```

---

**User**

yes this makes sense. 
Also, going back to the pharma user, we want to restrict their visibility to only patients that are participating as research subjects in a research study that is being sponsored by them

---

**Cursor**

That's a very important and granular requirement for the Pharma User role! It makes perfect sense for clinical trial oversight.

This significantly refines the "De-identification Strategy" and the `AccessPolicy` for Pharma Users. Simply tagging an `Observation` as "de-identified" is not enough; we also need to ensure it pertains to a patient relevant to the Pharma company's sponsored trial.

Let's update **Step 4.3.2.2. Pharmaceutical Company Users AccessPolicy Design** with this new constraint:

*   **Role:** Pharmaceutical Company User
*   **Scope:** Across multiple hospital `Project`(s) they are explicitly granted membership to.
*   **Permissions:** Strictly `read-only`.
*   **FHIR Resources & Data Views:**
    *   **Individual De-identified Results (Conditional Access):**
        *   Access is granted to de-identified `Observation`s, `DiagnosticReport`s, and potentially derived `Binary` reports *only if* the associated `Patient` is enrolled as a `ResearchSubject` in a `ResearchStudy` that is sponsored by (or otherwise appropriately linked to) the specific pharmaceutical company the user represents.
        *   This means the system must be able to:
            1.  Identify the Pharma company associated with the Pharma user.
            2.  For any `Observation`/`DiagnosticReport`, trace back to the `Patient`.
            3.  Check if that `Patient` is a `ResearchSubject` in any relevant `ResearchStudy`.
            4.  Verify if that `ResearchStudy` is sponsored by the Pharma user's company (e.g., via `ResearchStudy.sponsor` pointing to the Pharma company's `Organization` resource, or via another identifier/extension on `ResearchStudy`).
            5.  Ensure the data viewed is de-identified.
    *   **Aggregated Statistics:**
        *   Similar conditions might apply: aggregated statistics could be filtered to only include data from patients in their sponsored trials, or they might see broader site-level aggregates that are not patient-specific. This needs clarification. For now, let's assume aggregated stats would also ideally be cohort-specific if possible.

*   **Implementation Strategy for Conditional Access & De-identification:**
    *   **Using Medplum Bots is highly recommended here.**
        *   A Bot (or set of Bots) would be responsible for:
            *   Identifying `Patient`s enrolled in specific pharma-sponsored `ResearchStudy`s.
            *   When relevant clinical data (like `Observation`s) are created for these patients, the Bot would:
                *   Create de-identified copies of this data.
                *   "Tag" these de-identified copies with an identifier linking them to the specific Pharma company and/or `ResearchStudy` (e.g., using `meta.tag`, an `extension`, or by adding them to a pharma-specific `Group`).
    *   **Pharma User `AccessPolicy`:**
        *   The `AccessPolicy` for the Pharma user would then grant `read` access to these pre-processed, de-identified, and appropriately tagged/grouped resources.
        *   The `criteria` in the `AccessPolicy` would look for these specific tags/extensions/group memberships. This makes the `AccessPolicy` itself simpler and more performant than trying to do complex multi-resource joins and checks directly within the policy's FHIRpath.
*   **Key Constraints:**
    *   Robust De-identification.
    *   Principle of Minimum Necessary.
    *   Access strictly limited to `Project`(s) they are members of, *and* further restricted by the sponsorship linkage.

This approach (Bot-assisted processing + simpler AccessPolicy) makes the complex logic auditable and manageable. The Bot handles the "who is this data for?" and "is it properly de-identified?" questions, and the AccessPolicy enforces "can this user see data prepared in this way?".

This detailed design for Pharma User access will be crucial for implementation.

Now that we have a solid conceptual design for the `AccessPolicy` resources for all key roles (Hospital Staff, Pharma Users, Your Company Admins), we can proceed to the next step, which is about setting up some initial structures locally to test these concepts.

**Step 4.3.3. Local Test Project Setup:**

First sub-step:
**4.3.3.1. Create a few sample `Project` entities in your local Medplum instance to represent different hospitals.**

Using the Puppeteer-controlled browser session where you are logged in as `admin@example.com`:
1.  You should currently be on the "Projects" page (listing "Super Admin" and "FHIR R4" projects).
2.  We identified that there's a "New..." button to create new projects.

I will now guide Puppeteer to:
1.  Click the "New..." button.
2.  We'll then need to fill in a name for the first sample hospital project. Let's call it "General Hospital - Site A".
3.  Then save it.
4.  Repeat the process to create a second sample project, "Wellness Clinic - Site B".

Are you ready for me to try clicking the "New..." button via Puppeteer?

