// Google Cloud reCAPTCHA Enterprise Service
// Cần cài đặt: npm install @google-cloud/recaptcha-enterprise

import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

const projectID = 'sipsmart';
const recaptchaKey = '6Lc-jjcsAAAAANH3H3PqDGVuHvqNW-A2DvfObniN';

let client: RecaptchaEnterpriseServiceClient | null = null;

function getClient(): RecaptchaEnterpriseServiceClient {
  if (!client) {
    client = new RecaptchaEnterpriseServiceClient({
      // Credentials sẽ được load từ environment hoặc default credentials
      projectId: projectID,
    });
  }
  return client;
}

/**
 * Tạo assessment để phân tích rủi ro của một action
 * @param token - Token từ client
 * @param recaptchaAction - Action name (LOGIN, REGISTER, etc.)
 * @returns Score từ 0.0 đến 1.0 (1.0 = low risk, 0.0 = high risk)
 */
export async function createAssessment(
  token: string,
  recaptchaAction: string
): Promise<number | null> {
  try {
    const client = getClient();
    const projectPath = client.projectPath(projectID);

    // Tạo request assessment
    const request = {
      assessment: {
        event: {
          token: token,
          siteKey: recaptchaKey,
        },
      },
      parent: projectPath,
    };

    const [response] = await client.createAssessment(request);

    // Kiểm tra token có hợp lệ không
    if (!response.tokenProperties?.valid) {
      return null;
    }

    // Kiểm tra action có khớp không
    if (response.tokenProperties.action !== recaptchaAction) {
      return null;
    }

    // Lấy risk score
    const score = response.riskAnalysis?.score || 0;

    // Log reasons nếu có
    if (response.riskAnalysis?.reasons) {
      response.riskAnalysis.reasons.forEach((reason) => { });
    }

    return score;
  } catch (error) {
    return null;
  }
}

/**
 * Verify token với Google Cloud reCAPTCHA Enterprise
 * @param token - Token từ client
 * @param action - Action name
 * @returns Object với success và score
 */
export async function verifyRecaptcha(
  token: string,
  action: string
): Promise<{ success: boolean; score: number; error?: string }> {
  const score = await createAssessment(token, action);

  if (score === null) {
    return {
      success: false,
      score: 0,
      error: 'Invalid token or action mismatch',
    };
  }

  // Score >= 0.5 được coi là hợp lệ (có thể điều chỉnh)
  const threshold = 0.5;
  return {
    success: score >= threshold,
    score,
  };
}

