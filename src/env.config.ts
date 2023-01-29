import {
  SecretsManagerClient,
  GetSecretValueCommand
} from '@aws-sdk/client-secrets-manager'

export async function setEnvVar () {
  const secretName = 'mysecrets'
  const client = new SecretsManagerClient({
    region: 'ap-northeast-1'
  })

  try {
    console.log('start setting env var........')
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: 'AWSCURRENT'
      })
    )
    const secret = response.SecretString

    if (secret) {
      const parsedSecret = JSON.parse(secret)
      for (const [key, value] of Object.entries(parsedSecret)) {
        process.env[key] = value as string
      }
      console.log('@@@!!', process.env.test1)
    }
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}
