# Quantum Giant v3
Quantum Giant Application Version 3.0. 

Version 2.x was written about four years ago, and was the first large-scale app I stood up in React. While the application works great in the wild, I have come to regard the cods as fragile, as my fledgling understanding of JSX at the time did not translate into the implementation of best practices. 

V3 will begin exactly where V2 left off, seeking to satisfy several goals (as follows):

## Goals of V3
- Convert all vanilla JS to TypeScript
- Shore up deployment pipeline (it's in rough shape right now)
- Add user features and fix bugs as reported.

## Frontend App Info
Written in vanilla JS (to be replaced by TS in v3), this app uses a React SPA hosted on a PHP index that also facilitates connection to the API. 

Local frontend development is possible by using the remote API, provided the user targets the public hosted API url and configures the app to mount to the standard HTML index, a la CRA. If using the PHP index, contents of the HTML file are ingested and served to base route, to which the SPA is mounted, and beyond which the API can be accessed via the same host. 

React Router handles user navigation on the frontend, with all other PHP routing being sequestered to the API.

## API Info
Hosted alongside the frontend's PHP index, a PHP REST API following RESTful principles serves all dynamic requests from the app. Each file in the `routes` folder serves as a controller, utilizing a targeted `action` to serve the request. In accordance with current development goals, this will be upgraded to a reusable Docker container, instead of relying on ad-hoc SFTP transfers.

## API Route Structure
`{host}/api/{route}/{action}?params=action-or-route-specific&multi_params=possible`

A really cool feature of the app is that frontend params can be shared via the backend. For example, say an employee wants to see how a certain artist is doing in March. They can directly bookmark a frontend url like `{prodHost}.com/artist/{artist_id}/spins?start_date=2023-03-01&end_date=2023-04-01`. This is helpful for the app's power users, and is insanely convenient for me to use, based on the complexity of the queries facilitated by the API. Speaking of which...



## Disclaimer
Quantum Giant is a proprietary internal tool for my former employer. Unfortunately, it's not for use anywhere else. This repo exists publicly solely to provide a showcase.
