# CampusNet Project Rules

## 1. Frontend Architecture (Client)
- **Framework**: React with Vite.
- **Component Style**: Always use **Functional Components** with Hooks. Class components are strictly forbidden.
- **Styling**: 
  - Use **Tailwind CSS** for ALL styling.
  - Aesthetic: **Cyberpunk/Dark Mode**. High-contrast neons (pink, cyan, purple) against deep dark backgrounds. Glassmorphism effects.
  - No vanilla CSS files unless absolutely necessary for global resets or complex animations not possible with Tailwind.
- **Icons**: Use `lucide-react` exclusively.
- **State Management**: Use React Context or local state. Keep it simple unless Redux is requested.
- **HTTP Client**: Use `axios` for all API requests.

## 2. Backend Architecture (Server)
- **Framework**: Node.js + Express.
- **Database**: MongoDB with Mongoose.
- **Routing**: ENDPOINTS MUST START WITH `/api`. Example: `/api/users`, `/api/reviews`.
- **Structure**: Controller-Service-Repository pattern is preferred but keep it simple for now (Routes -> Controllers -> Models).

## 3. General Development
- **Mocking**: If a backend feature is complex or blocks frontend progress, **MOCK IT ON THE FRONTEND** immediately. Do not get stuck waiting for backend logic.
- **Monorepo**: Keep strict separation between `/client` and `/server`.
