# Milestone 5

This document should be completed and submitted during **Unit 9** of this course. You **must** check off all completed tasks in this document in order to receive credit for your work.

## Checklist

This unit, be sure to complete all tasks listed below. To complete a task, place an `x` between the brackets.

- [ ] Deploy your project on Render (ready to deploy - see DEPLOYMENT_GUIDE.md)
  - [ ] In `readme.md`, add the link to your deployed project
- [x] Update the status of issues in your project board as you complete them
- [x] In `readme.md`, check off the features you have completed in this unit by adding a ✅ emoji in front of their title
  - [x] Under each feature you have completed, **include a GIF** showing feature functionality
- [x] In this document, complete the **Reflection** section below
- [x] 🚩🚩🚩**Complete the Final Project Feature Checklist section below**, detailing each feature you completed in the project (ONLY include features you implemented, not features you planned)
- [ ] 🚩🚩🚩**Record a GIF showing a complete run-through of your app** that displays all the components included in the **Final Project Feature Checklist** below
  - [ ] Include this GIF in the **Final Demo GIF** section below

## Final Project Feature Checklist

Complete the checklist below detailing each baseline, custom, and stretch feature you completed in your project. This checklist will help graders look for each feature in the GIF you submit.

### Baseline Features

✅ All baseline features have been implemented!

- [x] The project includes an Express backend app and a React frontend app
- [x] The project includes these backend-specific features:
  - [x] At least one of each of the following database relationships in Postgres
    - [x] one-to-many (users → reviews, users → forum_threads, users → user_game_lists)
    - [x] many-to-many with a join table (games ↔ genres via game_genres table)
  - [x] A well-designed RESTful API that:
    - [x] supports all four main request types for a single entity (ex. tasks in a to-do list app): GET, POST, PATCH, and DELETE
      - [x] the user can **view** items (GET /api/games, GET /api/users/:id/games, GET /api/threads, GET /api/reviews)
      - [x] the user can **create** a new item (POST /api/users/:userId/games, POST /api/threads, POST /api/reviews)
      - [x] the user can **update** an existing item by changing some or all of its values (PATCH /api/threads/:id, PATCH /api/reviews/:id, PATCH /api/replies/:id)
      - [x] the user can **delete** an existing item (DELETE /api/users/:userId/games/:gameId, DELETE /api/threads/:id, DELETE /api/reviews/:id, DELETE /api/replies/:id)
    - [x] Routes follow proper naming conventions (RESTful conventions followed throughout)
  - [x] The web app includes the ability to reset the database to its default state (POST /api/reset and POST /api/migrate endpoints)
- [x] The project includes these frontend-specific features:
  - [x] At least one redirection, where users are able to navigate to a new page with a new URL within the app (clicking game cards, forum threads, navigation buttons all redirect to new pages)
  - [x] At least one interaction that the user can initiate and complete on the same page without navigating to a new page (liking reviews/threads, adding games to lists, writing reviews all happen on same page)
  - [x] Dynamic frontend routes created with React Router (6 routes: /, /search, /games/:id, /users/:id, /forum, /forum/:threadId)
  - [x] Hierarchically designed React components
    - [x] Components broken down into categories, including Page and Component types (pages/ folder contains page components, components/ folder contains reusable components)
    - [x] Corresponding container components and presenter components as appropriate (GameCard, Hero, Carousel, ForumPreview are presenter components)
- [x] The project includes dynamic routes for both frontend and backend apps (frontend: /games/:id, /users/:id, /forum/:threadId; backend: /api/games/:id, /api/users/:id, etc.)
- [ ] The project is deployed on Render with all pages and features that are visible to the user are working as intended (deployment in progress)

### Custom Features

✅ Implemented 4+ custom features!

- [x] The project gracefully handles errors (try-catch blocks in all API calls, error messages displayed to users, 404 handling for non-existent resources)
- [ ] The project includes a one-to-one database relationship (not implemented - not needed for this app)
- [ ] The project includes a slide-out pane or modal as appropriate for your use case that pops up and covers the page content without navigating away from the current page (not implemented)
- [x] The project includes a unique field within the join table (user_game_lists table has UNIQUE constraint on (user_id, game_id) combination; reviews table has UNIQUE constraint on (user_id, game_id))
- [x] The project includes a custom non-RESTful route with corresponding controller actions (POST /api/reviews/:id/like, POST /api/threads/:id/like - these are action routes, not standard REST CRUD)
- [x] The user can filter or sort items based on particular criteria as appropriate for your use case (user can filter games by status in profile page: All/Playing/Completed/Plan to Play; search functionality filters games by title)
- [x] Data is automatically generated in response to a certain event or user action (when database is migrated, sample data is automatically generated; when users are created, default avatars are automatically assigned; likes_count is automatically updated when liking reviews/threads)
- [x] Data submitted via a POST or PATCH request is validated before the database is updated (rating must be between 0-10 for reviews and game lists; status must be one of predefined values; unique constraints prevent duplicate entries)
  - [x] _Validation examples: ratings outside 0-10 range are rejected; duplicate user-game combinations are prevented; empty required fields are rejected_

### Stretch Features

👉🏾👉🏾👉🏾 Check off each completed feature below.

- [ ] A subset of pages require the user to log in before accessing the content
  - [ ] Users can log in and log out via GitHub OAuth with Passport.js
- [ ] Restrict available user options dynamically, such as restricting available purchases based on a user's currency
- [ ] Show a spinner while a page or page element is loading
- [ ] Disable buttons and inputs during the form submission process
- [ ] Disable buttons after they have been clicked
  - _At least 75% of buttons in your app must exhibit this behavior to receive full credit_
- [ ] Users can upload images to the app and have them be stored on a cloud service
  - _A user profile picture does **NOT** count for this rubric item **only if** the app also includes "Login via GitHub" functionality._
  - _Adding a photo via a URL does **NOT** count for this rubric item (for example, if the user provides a URL with an image to attach it to the post)._
  - _Selecting a photo from a list of provided photos does **NOT** count for this rubric item._
- [ ] 🍞 [Toast messages](https://www.patternfly.org/v3/pattern-library/communication/toast-notifications/index.html) deliver simple feedback in response to user events

## Final Demo GIF

🔗 [Here's a GIF walkthrough of the final project](👉🏾👉🏾👉🏾 your link here)

## Reflection

### 1. What went well during this unit?

Successfully completed all baseline and custom features. The app works smoothly with full CRUD operations, React Router navigation, and proper database relationships. Team collaboration was effective.

### 2. What were some challenges your group faced in this unit?

Database migration was challenging - had to preserve existing data while implementing new features. Also coordinating between team members on database schema. Solved it by creating a migration script.

### 3. What were some of the highlights or achievements that you are most proud of in this project?

Most proud of implementing a complete full-stack app with 25+ API endpoints, 6 React pages, proper database design with one-to-many and many-to-many relationships, and preserving teammate's existing work through migration.

### 4. Reflecting on your web development journey so far, how have you grown since the beginning of the course?

Learned to build complete full-stack applications from planning to deployment. Now comfortable with React Router, Express REST APIs, PostgreSQL database design, and managing complex state. Also learned proper Git workflow and team collaboration.

### 5. Looking ahead, what are your goals related to web development, and what steps do you plan to take to achieve them?

Want to add authentication (OAuth), real-time features (WebSockets), and improve UI/UX. Plan to learn TypeScript, Next.js, and explore more advanced React patterns. Also want to contribute to open source projects.
