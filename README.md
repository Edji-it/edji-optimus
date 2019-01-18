# Optimus Prime (Edji Node Server)
[![CircleCI](https://circleci.com/gh/codiak/edji-server/tree/dev.svg?style=svg&circle-token=135514116131ec0f0c5daa9574db9fcf4a3b3b55)](https://circleci.com/gh/codiak/edji-server/tree/dev)

## Quick Start

### Install Homebrew

```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

### Install Packages

```bash
brew install node yarn
```

### Clone the repo

Clone with HTTPS: `https://github.com/codiak/edji-server.git`

Clone with SSH: `git@github.com:codiak/edji-server.git`

### Install More Packages

```bash
yarn install
yarn global add mocha
```

### Get Environment Variables

Node environment variables are used in order to configure differences in the application between local development, test, and production sites. We use the `dotenv` package to apply environment variables, so they are stored in the root directory in the a file called ".env". They can be obtained from another Edji team member. Your project will not run if it is missing one of the required environment variables.

## Continuous Integration

Optimus is auto-deployed to https://optimus-dev.edji.it from the `dev` branch, and to https://optimus.edji.it from the `master` branch. Committing directly to the `dev` branch is blocked, and must be done through a pull request in Github. Before any pull request can be merged, all server unit and e2e tests must pass in circleci.

### CircleCI

The configuration for CircleCI is stored in .circleci. The link to the current build can be found in the build status bar at the top of this page. 

## Heroku

Heroku configuration is only necessary if you'd like to follow logs for the Heroku apps or otherwise use the Heroku CLI to interface with the applications

Add the remotes
```bash
git remote add prod https://git.heroku.com/edji-prod.git
git remote add dev https://git.heroku.com/edji-dev.git
```

Push to `dev` and `prod`
```bash
git push prod master
git push dev master
```


Swap the default Heroku CLI remote
```bash
git config heroku.remote dev
git config heroku.remote prod
```

## Testing

Testing is automated with Mocha, and run with Yarn scripts.

Run the entire test suite
```bash
yarn test
```

Run a single endpoint's tests is done with a colon and the endpoint name.
```bash
yarn test:projects
```

## Local DB Setup
If you'd like to run with a local mongodb so that you can do devleopment offline, check this out:

`yarn install` should take care of downloading the correct `mongodb` version, as long as you're running commands from this directory
create a folder in the root directory called `data`
run `yarn start:local` to run the database locally and connect to it on your local server. The only complicated part is shutdown:

run `mongo` to connect to the locally running mongo instance, and then run `db.shutdownServer()` to stop the serving of the database cleanly (we'll put a command together to do this automatically later)
