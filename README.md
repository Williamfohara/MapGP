MapGP (MapGeopolitical)

- A web application that provides users with a geopolitical history of relationships between countries.
- Users can explore a timeline of key events and view detailed information about each event through interactive maps and text descriptions.
- The goal of MapGP is to help users understand the complexities of international relationships and how they have evolved over time.

Project Structure
MapGP consists of two main branches:

frontend: This branch contains all frontend code related to the user interface, including HTML, CSS, JavaScript, and interactive maps.
backend: This branch handles the backend code, which includes API routes, database management (MongoDB), and data generation using external APIs (such as OpenAI’s GPT).
The main branch is not currently in use but will be the integration point in the future.

Current Status
Frontend: The frontend allows users to select two countries, view a summary of their relationship, and explore a timeline of events between those countries. Users can click on timeline entries to view more details about each event.

Backend: The backend is responsible for fetching event data from MongoDB and populating the frontend. It uses Node.js with Express.js to handle requests and stores event data generated via OpenAI’s API.

Technology Stack
Frontend: HTML, CSS, JavaScript, Mapbox API
Backend: Node.js, Express.js, MongoDB
APIs: OpenAI GPT for generating text, Mapbox for map visualizations
