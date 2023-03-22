# quantum_giant_v3
Quantum Giant Application Version 3.0. 

Version 2.x was written about four years ago, and was the first large-scale app I stood up in React. While the application works great in the wild, I have come to regard the cods as fragile, as my fledgling understanding of JSX at the time did not translate into the implementation of best practices. 

V3 will begin exactly where V2 left off, seeking to satisfy several goals (as follows):

## Goals of V3
- Convert all vanilla JS to TypeScript
- Shore up deployment pipeline (it's in rough shape right now)
- Add user features and fix bugs as reported.


## API Info
This app is deployed in production on a LAMP stack, using a PHP index instead of the standard HTML index (a la CRA). In accordance with current development goals, this will be upgraded to a reusable Docker container, instead of relying on ad-hoc SFTP transfers.
