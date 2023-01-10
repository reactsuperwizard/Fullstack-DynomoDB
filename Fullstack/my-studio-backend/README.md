# Passtree.net Backend Lambda Functions

## Clone the source code

```
git clone https://github.com/fitforce/my-studio-backend
```

## For development

### Setup environment

1. Register environment variables named as AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY with valid key values

2. rename .env.default file to .env and put real values

### Install packages and CLI tool

1. Make sure you've installed all depedencies.

```
npm install
# or
yarn
```

2. Install serverless CLI tool

```
npm install -g serverless
```

### useful serverless CLI commands

1. Deploy all the functions:

```
sls deploy --region us-west-1
```

2. Deploy a certain function

```
sls deploy functions -f FunName
```

```
sls deploy function --function helloWorld --stage dev --region us-west-1
```

3. Get console log for a certain function

```
sls logs -f hello -t
```

4. Run the lambda functions in the local mode (port can be set in package.json)

```
npm run local
```

## Built With

- [Node.js 12.x](https://nodejs.org/)
- [serverless](https://www.serverless.com/)
- [AWS Lambda](https://aws.amazon.com/lambda/)

## Authors

- @parsa
- @jorgihno

## Acknowledgments

- Node.js
- Serverless
- AWS Lambda
- PostgreSQL
