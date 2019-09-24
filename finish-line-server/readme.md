# Finish Line Server

This project is the API server for the Finish Line application.

## Setup and Configuration

This server is designed with a minimum no-hassle amount of setup.

### Install MongoDB

Finish Line requires MongoDB version 4 or later. The server will create the `finish-line` database and initialize all collections.

Install MongoDB with the following options:

1. Configure it to run as a service on port 27017.
2. Create the data directory: `c:\data\db`

The server will connect at the following URL:

```
mongodb://127.0.0.1:27017/finish-line
```

That's it. The server should take care of everything else for you.

No mess. No fuss. No stress.
