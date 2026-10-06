# Resume Builder – React frontend

Black and light-green interface for the Django API. Admins create student logins and the course catalog; students build their resume step by step and download it as a PDF.

## Run it

Start the Django backend first (it must be on port 8000):

```bash
cd backend
venv\Scripts\activate
python manage.py runserver
```

Then, in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and sign in with the admin account you made with `createsuperuser`.

In development, Vite forwards every `/api` request to `http://127.0.0.1:8000`, so there's nothing to configure.

## Folder structure

```
src/
├── api/            axios client (JWT + auto refresh) and every endpoint
├── context/        AuthContext: login, logout, current user, where to send them
├── components/     buttons, inputs, modal, toasts, CrudSection, ResumeView templates
├── layouts/        AdminLayout (menu) and StudentLayout (progress build line)
├── pages/
│   ├── auth/       Login, ChangePassword
│   ├── admin/      Dashboard, Students, StudentResume, Courses, CourseEditor
│   └── student/    Header, Summary, Skills, Experience, Projects,
│                   Education, Certifications, Additional, Resume
├── styles/         theme.css (all colors live in the :root tokens at the top)
└── utils/          error parsing and date formatting
```

## How the flow works

1. **Admin** signs in, creates a student login, and shares the email and temporary password shown once.
2. **Student** signs in and must set their own password first.
3. The student fills the **header**. Every other step stays locked until it's complete.
4. Then: summary (pick a course, pick its summary), skills (add courses), experience, projects (pick from added courses, optionally under a job), education, certifications, additional info.
5. **Preview and download:** pick one of three layouts and use Download PDF (choose "Save as PDF" in the print window).

## Change the colors

Edit the tokens at the top of `src/styles/theme.css`, for example `--accent` for the green.

## Production build

```bash
npm run build
```

Upload the `dist/` folder to your host. Set `VITE_API_URL` in `.env` to your backend URL (e.g. `https://api.example.com/api`) before building, and add your frontend URL to `CORS_ALLOWED_ORIGINS` in the backend `.env`.
