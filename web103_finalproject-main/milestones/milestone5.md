# Milestone 5

This document should be completed and submitted during **Unit 9** of this course. You **must** check off all completed tasks in this document in order to receive credit for your work.

## Checklist

This unit, be sure to complete all tasks listed below. To complete a task, place an `x` between the brackets.

- [ ] Deploy your project on Render
  - [ ] In `readme.md`, add the link to your deployed project
- [x] Update the status of issues in your project board as you complete them
- [x] In `readme.md`, check off the features you have completed in this unit by adding a ✅ emoji in front of their title
  - [x] Under each feature you have completed, **include a GIF** showing feature functionality
- [x] In this document, complete the **Reflection** section below
- [x] 🚩🚩🚩**Complete the Final Project Feature Checklist section below**, detailing each feature you completed in the project (ONLY include features you implemented, not features you planned)
- [x] 🚩🚩🚩**Record a GIF showing a complete run-through of your app** that displays all the components included in the **Final Project Feature Checklist** below
  - [x] Include this GIF in the **Final Demo GIF** section below

## Final Project Feature Checklist

Complete the checklist below detailing each baseline, custom, and stretch feature you completed in your project. This checklist will help graders look for each feature in the GIF you submit.

### Baseline Features

👉🏾👉🏾👉🏾 Check off each completed feature below.

- [x] The project includes an Express backend app and a React frontend app
- [x] The project includes these backend-specific features:
  - [x] At least one of each of the following database relationships in Postgres
    - [x] one-to-many (users → user_game_lists, users → reviews, users → forum_threads)
    - [x] many-to-many with a join table (users ↔ achievements via user_achievements, games ↔ genres via game_genres)
  - [x] A well-designed RESTful API that:
    - [x] supports all four main request types for a single entity (ex. tasks in a to-do list app): GET, POST, PATCH, and DELETE
      - [x] the user can **view** items, such as tasks (GET /api/my/games)
      - [x] the user can **create** a new item, such as a task (POST /api/my/games)
      - [x] the user can **update** an existing item by changing some or all of its values, such as changing the title of task (PATCH /api/my/games/:gameId)
      - [x] the user can **delete** an existing item, such as a task (DELETE /api/my/games/:gameId)
    - [x] Routes follow proper naming conventions
  - [x] The web app includes the ability to reset the database to its default state (POST /api/reset)
- [x] The project includes these frontend-specific features:
  - [x] At least one redirection, where users are able to navigate to a new page with a new URL within the app (login redirect, game details navigation)
  - [x] At least one interaction that the user can initiate and complete on the same page without navigating to a new page (adding games to list, posting forum replies)
  - [x] Dynamic frontend routes created with React Router (/:id routes for games and forum threads)
  - [x] Hierarchically designed React components
    - [x] Components broken down into categories, including Page and Component types (HomePage, GameCard, Hero, Carousel, ReviewSection, AchievementsSection)
    - [x] Corresponding container components and presenter components as appropriate
- [x] The project includes dynamic routes for both frontend and backend apps
- [ ] The project is deployed on Render with all pages and features that are visible to the user are working as intended

### Custom Features

👉🏾👉🏾👉🏾 Check off each completed feature below.

- [x] The project gracefully handles errors (API error handling with try-catch, fallback game creation, user-friendly error messages)
- [X] The project includes a one-to-one database relationship
- [ ] The project includes a slide-out pane or modal as appropriate for your use case that pops up and covers the page content without navigating away from the current page
- [x] The project includes a unique field within the join table (user_game_lists has unique(user_id, game_id) constraint, reviews has unique(user_id, game_id) constraint)
- [x] The project includes a custom non-RESTful route with corresponding controller actions (GET /api/my/recommendations generates personalized recommendations, GET /api/igdb/trending for IGDB data)
- [x] The user can filter or sort items based on particular criteria as appropriate for your use case (filter games by status: playing/completed/plan to play, filter achievements by unlocked/locked status)
- [x] Data is automatically generated in response to a certain event or user action. Examples include generating a default inventory for a new user starting a game or creating a starter set of tasks for a user creating a new task app account (achievements automatically awarded when user completes actions, personalized recommendations generated based on user's game history)
- [x] Data submitted via a POST or PATCH request is validated before the database is updated (e.g. validating that an event is in the future before allowing a new event to be created) (validates required fields like title/body for forum threads, rating/review_text for reviews, game existence validation)
  - [x] _To receive full credit, please be sure to demonstrate in your walkthrough that for certain inputs, the item will NOT be successfully created or updated._

### Stretch Features

👉🏾👉🏾👉🏾 Check off each completed feature below.

- [x] A subset of pages require the user to log in before accessing the content
  - [x] Users can log in and log out via GitHub OAuth with Passport.js (profile page, recommendations page, forum posting require authentication)
- [x] Restrict available user options dynamically, such as restricting available purchases based on a user's currency (users can only edit/delete their own forum posts and threads, games filtered from recommendations if already in user's list)
- [ ] Show a spinner while a page or page element is loading
- [x] Disable buttons and inputs during the form submission process
- [x] Disable buttons after they have been clicked (add to list buttons show "✓ Added" state and are disabled, form submit buttons disable during submission)
  - _At least 75% of buttons in your app must exhibit this behavior to receive full credit_
- [ ] Users can upload images to the app and have them be stored on a cloud service
  - _A user profile picture does **NOT** count for this rubric item **only if** the app also includes "Login via GitHub" functionality._
  - _Adding a photo via a URL does **NOT** count for this rubric item (for example, if the user provides a URL with an image to attach it to the post)._
  - _Selecting a photo from a list of provided photos does **NOT** count for this rubric item._
- [ ] 🍞 [Toast messages](https://www.patternfly.org/v3/pattern-library/communication/toast-notifications/index.html) deliver simple feedback in response to user events

## Final Demo GIF

🔗 [Here's a GIF walkthrough of the final project](![alt text](<gamilist forU.gif>))

## Reflection

### 1. What went well during this unit?

Successfully integrated all major features including the community forums and personalized recommendations. The IGDB API integration worked smoothly for fetching real game data, and the achievement system automatically triggers as expected. The frontend and backend communication was seamless after establishing consistent parameter naming conventions.

### 2. What were some challenges your group faced in this unit?

The biggest challenge was managing foreign key constraints when users interact with games from the IGDB API that aren't yet in our local database. We had to implement automatic game insertion logic across multiple endpoints (adding to list, creating reviews, posting forum threads). Another challenge was ensuring the achievement system triggers correctly after various user actions without creating duplicate awards.

### 3. What were some of the highlights or achievements that you are most proud of in this project?

Most proud of the personalized recommendation system that analyzes user preferences based on completed games and ratings, then suggests similar games from their favorite genres. The achievement system that automatically tracks and rewards user milestones is also a highlight. The community forum with full CRUD operations for threads and replies demonstrates solid full-stack development skills.

### 4. Reflecting on your web development journey so far, how have you grown since the beginning of the course?

Gained significant experience in full-stack development, from database design with complex relationships (one-to-many, many-to-many) to implementing secure authentication with GitHub OAuth. Learned how to integrate third-party APIs effectively and handle edge cases gracefully. Improved understanding of React state management, component architecture, and RESTful API design patterns.

### 5. Looking ahead, what are your goals related to web development, and what steps do you plan to take to achieve them?

Plan to learn more about performance optimization, caching strategies, and implementing real-time features with WebSockets. Want to explore advanced deployment strategies including CI/CD pipelines and monitoring tools. Also interested in learning TypeScript for better type safety and exploring Next.js for server-side rendering. Will continue building projects and contributing to open source to solidify these skills.
