# Resume Builder

Django + Django REST Framework + PostgreSQL backend, React frontend.

```
resume-builder/
├── backend/
│   ├── config/        settings, urls
│   ├── accounts/      users (login only), roles, admin-creates-login service
│   ├── catalog/       admin catalog: courses, topics, contents, projects, bullets, summaries
│   └── students/      student profile, selections, experience, education, certifications
└── frontend/          React app (created in step 2)
```

## 1. Backend setup

**Create the PostgreSQL database** (psql or pgAdmin):

```sql
CREATE DATABASE resume_builder;
```

**Install and run:**

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac / Linux
pip install -r requirements.txt

copy .env.example .env         # Windows  (cp on Mac / Linux)
# then edit .env with your PostgreSQL password

python manage.py migrate       # creates all 15 tables
python manage.py createsuperuser   # this becomes your first ADMIN
python manage.py runserver
```

Open http://127.0.0.1:8000/admin and log in with the admin account.
You can already add courses, topics, projects and summaries there.

> The earlier `.sql` files are **not needed**. Django migrations create every
> table. The SQL triggers are replaced by model validation (see below).

## 2. Frontend setup

```bash
# from the resume-builder folder
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-router-dom
npm run dev                    # http://localhost:5173
```

## Where the architecture rules live

| Rule | Code |
|---|---|
| Only admins create student logins | `accounts/services.py` → `create_student_login()` |
| Login + empty profile created together | same function, one transaction |
| Student must change temp password first | `accounts/permissions.py` → `IsStudentRole` |
| Summary must belong to chosen course | `students/models.py` → `StudentSummary.clean()` |
| Pick the course before its project | `students/models.py` → `StudentProject.clean()` |
| Experience must belong to same student | `students/models.py` → `StudentProject.clean()` |
| End date required unless current job | DB check constraint on `StudentExperience` |

## Next steps

1. Auth API: login (JWT), change password
2. Admin API: create student login, CRUD for catalog
3. Student API: header, summary picker, skills, projects, experience, education, certifications
4. Resume API: one endpoint returning the full resume
5. React: admin dashboard, student dashboard, resume templates
