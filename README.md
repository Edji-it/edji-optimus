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

## Heroku

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

## Modifying Models

### Removing Properties
- Must clean the property from the database
- Increment server as a Major version

## Local DB Setup
If you'd like to run with a local mongodb so that you can do devleopment offline, check this out:

`yarn install` should take care of downloading the correct `mongodb` version, as long as you're running commands from this directory
run `yarn start:local` to run the database locally and connect to it on your local server. The only complicated part is shutdown:

run `mongo` to connect to the locally running mongo instance, and then run `db.shutdownServer()` to stop the serving of the database cleanly (we'll put a command together to do this automatically later)