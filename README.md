# Quantum Giant v3
Quantum Giant Application Version 3.0. 

Version 2.x was written about four years ago, and was the first large-scale app I stood up in React. While the application works great in the wild, I have come to regard the cods as fragile, as my fledgling understanding of JSX at the time did not translate into the implementation of best practices. 

V3 will begin exactly where V2 left off, seeking to satisfy several goals (as follows):

## Goals of V3
- Convert all vanilla JS to TypeScript
- Shore up deployment pipeline (it's in rough shape right now)
- Add user features and fix bugs as reported.

## Frontend App Info
Written in vanilla JS (to be replaced by TS in v3), this app uses a React SPA hosted on a PHP index that also facilitates connection to the API. Local frontend development is possible by using the remote API, provided the user targets the public API url and uses the standard CRA HTML index. The PHP index then gets the HTML file's contents to serve at the base route, and all other PHP routing pertains to the API (React Router handles user navigation on the frontend).

## API Info
Hosted alongside the frontend's PHP index, a PHP REST API following RESTful principles serves all dynamic requests from the app. Each file in the `routes` folder serves as a controller, utilizing a targeted `action` to serve the request. In accordance with current development goals, this will be upgraded to a reusable Docker container, instead of relying on ad-hoc SFTP transfers.

## Disclaimer
Quantum Giant is a proprietary internal tool for my former employer. Unfortunately, it's not for use anywhere else. This repo exists publicly solely to provide a showcase.
