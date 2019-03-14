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
yarn install
```

### Clone the repo

Clone with HTTPS: `https://github.com/codiak/edji-server.git`

Clone with SSH: `git@github.com:codiak/edji-server.git`

### Get Environment Variables

Node environment variables are used in order to configure differences in the application between local development, test, and production sites. We use the `dotenv` package to apply environment variables, so they are stored in the root directory in the a file called ".env". They can be obtained from another Edji team member, or by the Heroku CLI with the command `heroku config`. Your project will not run if it is missing one of the required environment variables.

### Run the app

Just do

```bash
yarn start
```

## Debugging

We are set up to debug using VS Code's tools. Simply start the app, then go to VS Code's debug menu and press the run button with "Debug" selected in the menu. You can register breakpoints directly in the code.

## Continuous Integration

### CircleCI

The configuration for CircleCI is stored in .circleci. The link to the current build can be found in the build status bar at the top of this page. 

### Heroku

Optimus is auto-deployed to https://optimus-dev.edji.it from the `dev` branch, and to https://optimus.edji.it from the `master` branch. Committing directly to the `dev` branch is blocked, and must be done through a pull request in Github. Before any pull request can be merged, all server unit and e2e tests must pass in circleci.

Heroku cli configuration is necessary if you'd like to follow logs for the Heroku apps or otherwise use the Heroku CLI to interface with the applications

Add the remotes
```bash
git remote add prod https://git.heroku.com/edji-prod.git
git remote add dev https://git.heroku.com/edji-dev.git
```


Swap the default Heroku CLI remote
```bash
git config heroku.remote dev
git config heroku.remote prod
```

Specify Heroku CLI remote you'd like to use for a specific command

```bash
heroku <command> -r <remote>
```

## Testing

Testing is automated with Mocha, and run with Yarn scripts.

Run the entire test suite
```bash
yarn test
```

Running smaller groups of tests can be done with the `--grep` option. This will grep through the `describe` and `it` statements.
```bash
yarn test --grep 'POST /api/v1/users'
```

## Local DB Setup
If you'd like to run with a local mongodb so that you can do devleopment offline, check this out:

`yarn install` should take care of downloading the correct `mongodb` version, as long as you're running commands from this directory
create a folder in the root directory called `data`
run `yarn start:local` to run the database locally and connect to it on your local server. The only complicated part is shutdown:

run `mongo` to connect to the locally running mongo instance, and then run `db.shutdownServer()` to stop the serving of the database cleanly (we'll put a command together to do this automatically later)
