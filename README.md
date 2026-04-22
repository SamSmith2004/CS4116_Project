# CS4116 Project
## Description
Extracurricular is a dating website for university students

## Contributors
- 23388986: Sam Smith
- 23327987: Leo Brady
- 23361077: Ilias Kourousis
- 25510126: Nicholas Frantz

## Local Setup
- Install Node JS 
- Place the `.env` file in the contents: 
    - **For Grading**: .env file will be provided in submission
    - **For Contributors**: see WhatsApp for .env
- Run the following commands in the extracurricular folder to install dependencies:
```sh
npm install
```
- Run the following command to start the app
```sh
npm run dev
```

## Host With Docker

### Build on and Run on Local Machine
Run the following command to build the image from the Dockerfile

```
docker build --build-arg DATABASE_URL=postgres://root:mysecretpassword@fritznetwork.my.to:5432/local --build-arg ORIGIN=http://fritznetwork.my.to:5173 --build-arg BETTER_AUTH_SECRET=0M2xR37lrxeupxbHp3aIl2eFKWsrgVyK -t extracurricular
```

To run on a local machine, spin up the docker image with the following command:
```
docker run -p 5432:5432 -e DATABASE_URL=postgres://root:mysecretpassword@fritznetwork.my.to:5432/local -e ORIGIN=http://localhost:5173 -e BETTER_AUTH_SECRET=0M2xR37lrxeupxbHp3aIl2eFKWsrgVyK extracurricular
```