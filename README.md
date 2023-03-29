# Quantum Giant v3
A dynamic SPA that displays and analyzes XM performance data across the catalog (artists, albums, and tracks) of Comedy Record Label 800 Pound Gorilla Records.

## Background
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

A really cool feature of the app is that frontend params can be shared via the backend. For example, say an employee wants to see how a certain artist is doing in March. They can directly bookmark a frontend url like `{prodHost}.com/artist/{artist_id}/spins?start_date=2023-03-01&end_date=2023-04-01`. These filters are then parsed and fed into the backend. This is helpful for the app's power users, and is insanely convenient for me to use, based on the complexity of the queries facilitated by the API. Speaking of which...

## DB setup / queries
First, a bit of context. One of the company's main problems – a problem that plagues every corner of Royalty Metadata World – is string matching. Be it human error via misspellings or character limits via public APIs, **performances very frequently go unreported**. To solve for this, the database ingests data exactly as it is displayed (see `xm_cataloguer` for the ingestion mechanism), and effient-but-complex queries are utilized to do most of the heavy lifting. 

Fortunately, all of this knowledge is built into architecture of the application, allowing users to *flag alternate spellings on anything* and retroactively reassign them to their proper place. For that reason, queries are built dynamically, and while they appear bulky, response times are often extremely quick.

## Disclaimer
Quantum Giant is a proprietary internal tool exclusively licensed for use by my former employer. Unfortunately, it's not for use anywhere else. This repo exists publicly solely to serve as a showcase.
