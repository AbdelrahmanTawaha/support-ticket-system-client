# Support Ticket System - Client (Angular)

Frontend client for the **Support Ticket System** project (T2 training), built to consume the ASP.NET Core Web API.
Includes authentication, role-based UI, ticket management dashboards, and real-time updates integration.

## Features
- JWT authentication (login/logout) + protected routes (Guards)
- Role-based UI (Manager / Employee / Client)
- Tickets: list, details, status workflow, comments
- Attachments upload/download
- HTTP Interceptors (attach token, handle errors)
- Modular services + clean folder structure

## Tech Stack
- Angular, TypeScript, RxJS
- Bootstrap / CSS
- REST API integration with ASP.NET Core

## Setup & Run
1) Install dependencies:
```bash
npm install
