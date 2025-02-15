/* eslint-disable @typescript-eslint/restrict-template-expressions */
import UserModel from '../../../datalayer/user'
import { StatusType } from '../../../datalayer/user/model'
import { getUserByEmail } from '../../../services/create_user'
import { sendConfirmationEmail } from '../../../services/send_emails'
import { comparePassword } from '../../../utils/auth'
import { decodeAppleToken } from '../apple_auth'
import {
  AuthProvider,
  DecodeTokenResult,
  JsonResponsePayload,
} from '../auth_types'
import { decodeGoogleToken } from '../google_auth'
import { createMobileAuthPayload } from '../jwt_helpers'

export async function createMobileSignInResponse(
  isAndroid: boolean,
  token?: string,
  provider?: AuthProvider
): Promise<JsonResponsePayload> {
  try {
    if (token && provider === 'GOOGLE') {
      const decodedTokenResult = await decodeGoogleToken(token, isAndroid)
      return createAuthResponsePayload(provider, decodedTokenResult)
    }

    if (token && provider === 'APPLE') {
      const decodedTokenResult = await decodeAppleToken(token)
      return createAuthResponsePayload(provider, decodedTokenResult)
    }

    throw new Error(`Missing or unsupported provider ${provider}`)
  } catch (e) {
    console.log('createMobileSignInResponse error', e)
    return authFailedPayload
  }
}

export async function createMobileEmailSignInResponse(
  email?: string,
  password?: string
): Promise<JsonResponsePayload> {
  try {
    if (!email || !password) {
      throw new Error('Missing username or password')
    }

    const user = await getUserByEmail(email.trim())
    if (!user?.id || !user?.password) {
      throw new Error('user not found')
    }

    const validPassword = await comparePassword(password, user.password)
    if (!validPassword) {
      throw new Error('password is invalid')
    }

    if (user.status === StatusType.Pending && user.email) {
      await sendConfirmationEmail({
        id: user.id,
        email: user.email,
        name: user.name,
      })
      return {
        statusCode: 200,
        json: { pendingEmailVerification: true },
      }
    }

    const mobileAuthPayload = await createMobileAuthPayload(user.id)

    return {
      statusCode: 200,
      json: mobileAuthPayload,
    }
  } catch (e) {
    console.log('createMobileEmailSignInResponse failed for user', {
      email,
      error: e,
    })
    return authFailedPayload
  }
}

const authFailedPayload = {
  statusCode: 403,
  json: { errorCodes: ['AUTH_FAILED'] },
}

async function createAuthResponsePayload(
  authProvider: AuthProvider,
  decodedTokenResult: DecodeTokenResult
): Promise<JsonResponsePayload> {
  if (!decodedTokenResult.email || decodedTokenResult.errorCode) {
    return authFailedPayload
  }

  try {
    const model = new UserModel()
    const user = await model.getWhere({
      email: decodedTokenResult.email,
      source: authProvider,
    })
    const userId = user?.id

    if (!userId) {
      return {
        statusCode: 403,
        json: { errorCodes: ['USER_NOT_FOUND'] },
      }
    }

    const mobileAuthPayload = await createMobileAuthPayload(userId)

    return {
      statusCode: 200,
      json: mobileAuthPayload,
    }
  } catch (e) {
    console.log('createAuthResponsePayload error', {
      error: e,
      email: decodedTokenResult.email,
    })
    return authFailedPayload
  }
}
