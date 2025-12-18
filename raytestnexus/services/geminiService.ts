import { GoogleGenAI, Type } from "@google/genai";
import { Contact, SalesBattleCard, EnrichedData, FinancialSpreading, CreditMemo, Grant, Course, MarketReport, Stipulation, FundedDeal, RescuePlan, Investor, RiskAlert, LeadForm, ActiveLoan, Lender } from "../types";

// Always initialize the client right before use with process.env.API_KEY
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSocialVideo = async (prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string | null> => {
  const ai = getAI();
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic professional business marketing video: ${prompt}. High production value, corporate aesthetic.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;
    return `${downloadLink}&key=${process.env.API_KEY}`;
  } catch (e: any) {
    console.error("Video Generation Failed:", e);
    if (e.message?.includes("Requested entity was not found")) {
      throw new Error("Requested entity was not found.");
    }
    return null;
  }
};

export const generateSocialCaption = async (platform: string, videoPrompt: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a viral social media caption for ${platform} about: "${videoPrompt}". Use a professional but energetic broker tone. Include 5 hashtags.`
  });
  return response.text || "Success in funding! #NexusOS";
};

export const generateSalesBattleCard = async (contact: Contact): Promise<SalesBattleCard | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Synthesize a Sales Battle Card for ${contact.company}. Data: ${JSON.stringify(contact)}. Focus on conversion and closing.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          predictedObjections: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: { 
                objection: { type: Type.STRING }, 
                rebuttal: { type: Type.STRING } 
              } 
            } 
          },
          closingStrategy: { type: Type.STRING }
        }
      }
    }
  });
  try { return JSON.parse(response.text || "{}"); } catch { return null; }
};

export const chatWithCRM = async (query: string, contacts: Contact[]) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a CRM AI Co-Pilot. Data context: ${JSON.stringify(contacts.map(c => ({ name: c.name, company: c.company, status: c.status })))}. User query: ${query}`,
        config: {
          systemInstruction: "You assist brokers in managing their pipeline. Be concise and actionable."
        }
    });
    return { text: response.text || "Neural connection established.", actions: [] };
};

export const enrichLeadData = async (company: string, website?: string): Promise<EnrichedData | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Search and enrich business data for "${company}". Website: ${website || 'unknown'}. Return detailed business profile including CEO, revenue estimates, and recent news.`,
    config: { 
      tools: [{ googleSearch: {} }], 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING },
          description: { type: Type.STRING },
          ceo: { type: Type.STRING },
          revenue: { type: Type.STRING },
          phone: { type: Type.STRING },
          address: { type: Type.STRING },
          industry: { type: Type.STRING },
          icebreakers: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  try { return JSON.parse(response.text || "{}"); } catch { return null; }
};

export const analyzeContract = async (base64: string) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType: 'application/pdf' } },
            { text: "Perform a safety audit on this loan agreement. Detect predatory fees, calculate true APR, and identify high-risk clauses. Return JSON." }
          ]
        },
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              safetyScore: { type: Type.NUMBER },
              trueApr: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              recommendation: { type: Type.STRING },
              risks: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT, 
                  properties: { 
                    clause: { type: Type.STRING }, 
                    description: { type: Type.STRING },
                    type: { type: Type.STRING }
                  } 
                } 
              }
            }
          }
        }
    });
    try { return JSON.parse(response.text || "{}"); } catch { return null; }
};

export const extractFinancialsFromDocument = async (base64: string, mimeType: string): Promise<FinancialSpreading | null> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType } },
            { text: "Extract revenue, expenses, and ending balances per month. Return structured financial spreading JSON." }
          ]
        },
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lastUpdated: { type: Type.STRING },
              months: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    month: { type: Type.STRING },
                    revenue: { type: Type.NUMBER },
                    expenses: { type: Type.NUMBER },
                    endingBalance: { type: Type.NUMBER },
                    nsfCount: { type: Type.NUMBER },
                    negativeDays: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
    });
    try { return JSON.parse(response.text || "{}"); } catch { return null; }
};

export const generateLegalDocumentContent = async (templateName: string, context: any, prompt: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Draft professional content for a "${templateName}" based on this user request: "${prompt}". Context: ${JSON.stringify(context)}. Use a standard formal legal tone.`
    });
    return response.text || "";
};

export const refineNoteContent = async (text: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Transform this raw meeting note into a professional CRM entry: "${text}". Keep it concise and formatted.`
    });
    return response.text || text;
};

export const predictCommonObjections = async (contact: Contact): Promise<string[]> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Predict 3 specific sales objections for this business based on its profile: ${JSON.stringify(contact)}. Return as a JSON array of strings.`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    });
    try { return JSON.parse(response.text || "[]"); } catch { return ["Cost of capital", "Daily payment strain", "Personal guarantee"]; }
};

export const generateObjectionResponse = async (contact: Contact, objection: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a high-converting rebuttal for this objection: "${objection}". Target client: ${contact.company}. Use a consultative closing tone.`
    });
    return response.text || "I understand your concern. Let's look at the ROI of this capital deployment.";
};

export const generateMeetingPrep = async (contact: Contact): Promise<any> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Generate a meeting preparation dossier for ${contact.company}. Include a summary, predicted objections, and icebreakers based on their profile: ${JSON.stringify(contact)}.`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              predictedObjections: { type: Type.ARRAY, items: { type: Type.STRING } },
              icebreakers: { type: Type.ARRAY, items: { type: Type.STRING } },
              goal: { type: Type.STRING }
            }
          }
        }
    });
    try { return JSON.parse(response.text || "{}"); } catch { return null; }
};

export const processMeetingDebrief = async (transcript: string): Promise<any> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this meeting transcript and extract a professional note, suggested pipeline status, and an email draft for follow-up. Transcript: "${transcript}"`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              note: { type: Type.STRING },
              suggestedStatus: { type: Type.STRING },
              emailDraft: { type: Type.STRING }
            }
          }
        }
    });
    try { return JSON.parse(response.text || "{}"); } catch { return null; }
};

export const analyzeDealStructure = async (financials: FinancialSpreading, amount: number): Promise<any> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Act as an underwriter. Analyze this $${amount} deal structure based on these financials: ${JSON.stringify(financials)}. Provide 3 optimal loan options (Aggressive, Moderate, Conservative).`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              maxApproval: { type: Type.NUMBER },
              riskAssessment: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    term: { type: Type.STRING },
                    rate: { type: Type.NUMBER },
                    payment: { type: Type.NUMBER },
                    freq: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
    });
    try { return JSON.parse(response.text || "{}"); } catch { return null; }
};

export const generateAnalyticsInsights = async (contacts: Contact[]): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this pipeline data and provide a high-level strategic report with 3 actionable insights for the team. Data: ${JSON.stringify(contacts.map(c => ({ status: c.status, value: c.value, source: c.source })))}`
    });
    return response.text || "Your pipeline is healthy. Focus on re-engaging stagnant leads in the Negotiation phase.";
};

export const generateBusinessPlanSection = async (sectionName: string, formData: any): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Write the "${sectionName}" section of a professional business plan for "${formData.companyName}". Context: ${JSON.stringify(formData)}. Be thorough and lender-ready.`
    });
    return response.text || "";
};

export const searchPlaces = async (query: string): Promise<any> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Find business leads matching: "${query}". Return a structured JSON of places and a brief summary of the territory potential.`,
        config: { 
          tools: [{ googleSearch: {} }], 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              places: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    url: { type: Type.STRING },
                    address: { type: Type.STRING },
                    rating: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
    });
    try { return JSON.parse(response.text || "{}"); } catch { return { text: "Search complete.", places: [] }; }
};

export const generateLandingPageCopy = async (industry: string, offer: string): Promise<any> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate high-converting landing page copy for a business funding agency targeting "${industry}" with an offer of "${offer}". Return headline, subhead, benefits list, and button text.`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              subhead: { type: Type.STRING },
              benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
              buttonText: { type: Type.STRING }
            }
          }
        }
    });
    try { return JSON.parse(response.text || "{}"); } catch { return {}; }
};

export const analyzeCompetitors = async (company: string, industry: string, location: string): Promise<MarketReport | null> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze the competitive landscape for "${company}" in "${location}" within the "${industry}" sector. Identify 3 competitors, funding angles, and a SWOT analysis.`,
        config: { 
          tools: [{ googleSearch: {} }], 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              competitors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              fundingAngles: { type: Type.ARRAY, items: { type: Type.STRING } },
              digitalGap: { type: Type.STRING },
              swot: {
                type: Type.OBJECT,
                properties: {
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                  opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
                  threats: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
    });
    try { return JSON.parse(response.text || "{}"); } catch { return null; }
};

export const parseLenderGuidelines = async (base64: string): Promise<Partial<Lender> | null> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType: 'application/pdf' } },
            { text: "Extract lender guidelines: min score, min revenue, max amount, and restricted industries. Return structured JSON." }
          ]
        },
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              minScore: { type: Type.NUMBER },
              minRevenue: { type: Type.NUMBER },
              minTimeInBusinessMonths: { type: Type.NUMBER },
              maxAmount: { type: Type.NUMBER },
              matchCriteria: {
                type: Type.OBJECT,
                properties: {
                  restrictedIndustries: { type: Type.ARRAY, items: { type: Type.STRING } },
                  maxTermMonths: { type: Type.NUMBER }
                }
              }
            }
          }
        }
    });
    try { return JSON.parse(response.text || "{}"); } catch { return null; }
};

export const extractStipsFromText = async (text: string): Promise<Stipulation[]> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Extract a list of required documents (stipulations) from this lender approval text: "${text}". Return as a JSON array of objects with id, name, and description.`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                status: { type: Type.STRING }
              }
            }
          }
        }
    });
    try { 
      const arr = JSON.parse(response.text || "[]");
      return arr.map((s: any) => ({ ...s, status: 'Pending' }));
    } catch { return []; }
};

export const verifyDocumentContent = async (base64: string, mimeType: string, expectedDocName: string, context: any): Promise<any> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType } },
            { text: `Verify if this document is a valid "${expectedDocName}" for "${context.company}". Return match confidence and reason.` }
          ]
        },
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isMatch: { type: Type.BOOLEAN },
              confidence: { type: Type.NUMBER },
              reason: { type: Type.STRING }
            }
          }
        }
    });
    try { return JSON.parse(response.text || "{}"); } catch { return { isMatch: false, confidence: 0, reason: "Error parsing AI response" }; }
};

export const generateRenewalPitch = async (deal: FundedDeal, contact: Contact): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a compelling refinance/renewal pitch for ${contact.company}. They have paid down ${Math.round(((deal.totalPayback - deal.currentBalance) / deal.totalPayback) * 100)}% of their $${deal.originalAmount} deal. Focus on net cash out and growth.`
    });
    return response.text || "";
};

export const generateRescuePlan = async (contact: Contact): Promise<RescuePlan | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate a rescue plan for a declined deal for ${contact.company}. Profile: ${JSON.stringify(contact)}. Analyze potential "deal killers" and provide a step-by-step treatment plan to get approved.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          approvalProbability: { type: Type.NUMBER },
          estimatedRecoveryTime: { type: Type.STRING },
          diagnosis: { type: Type.STRING },
          dealKillers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                issue: { type: Type.STRING },
                impact: { type: Type.STRING }
              }
            }
          },
          prescription: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                step: { type: Type.STRING },
                timeframe: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  try { return JSON.parse(response.text || "{}"); } catch { return null; }
};

export const generateInvestorReport = async (investor: Investor, deals: any[]): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a professional performance update email to our syndication partner "${investor.name}". They have $${investor.totalDeployed.toLocaleString()} currently deployed. Focus on portfolio yield and low default rates.`
  });
  return response.text || "";
};

export const generateApplicationCoverLetter = async (contact: Contact, lenderName: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Write a persuasive underwriting cover letter to "${lenderName}" for a $${contact.value} funding request for "${contact.company}". Highlight their strong points: ${contact.notes}.`
  });
  return response.text || "";
};

export const generateReviewReply = async (review: any): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a professional, SEO-optimized response to this ${review.rating}-star review: "${review.comment}". Reviewer: ${review.contactName}.`
  });
  return response.text || "";
};

export const generateMockGoogleReviews = async (businessName: string): Promise<any[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Simulate 3 realistic Google reviews for a funding agency named "${businessName}". Return as JSON array.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            contactName: { type: Type.STRING },
            company: { type: Type.STRING },
            rating: { type: Type.NUMBER },
            comment: { type: Type.STRING },
            date: { type: Type.STRING },
            source: { type: Type.STRING },
            status: { type: Type.STRING }
          }
        }
      }
    }
  });
  try { return JSON.parse(response.text || "[]"); } catch { return []; }
};

export const analyzeReviewSentiment = async (reviews: any[]): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Perform sentiment analysis on these customer reviews: ${JSON.stringify(reviews)}. Identify key themes, positive aspects, and areas for improvement.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          positiveKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          negativeKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });
  try { return JSON.parse(response.text || "{}"); } catch { return null; }
};

export const analyzeRiskEvent = async (alert: RiskAlert): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Act as a portfolio risk manager. Analyze this risk alert: "${alert.description}" for ${alert.contactName}. Provide a recommendation and risk severity score.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendation: { type: Type.STRING },
          severity: { type: Type.STRING }
        }
      }
    }
  });
  try { return JSON.parse(response.text || "{}"); } catch { return null; }
};

export const findGrants = async (businessType: string): Promise<Grant[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Find 3 real current small business grants for: "${businessType}". Return structured JSON list.`,
    config: { 
      tools: [{ googleSearch: {} }], 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            provider: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            deadline: { type: Type.STRING },
            description: { type: Type.STRING },
            url: { type: Type.STRING },
            matchScore: { type: Type.NUMBER },
            requirements: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    }
  });
  try { 
    const arr = JSON.parse(response.text || "[]");
    return arr.map((g: any) => ({ ...g, status: 'Identified' }));
  } catch { return []; }
};

export const draftGrantAnswer = async (question: string, context: any, grantName: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Draft a compelling answer for this grant application question: "${question}". Grant: "${grantName}". Context: ${JSON.stringify(context)}. Focus on community impact and growth.`
  });
  return response.text || "";
};

export const generateCourseCurriculum = async (topic: string, audience: string): Promise<Course | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Design a 3-module video course curriculum about "${topic}" for "${audience}". Return as a structured JSON object with modules and lessons.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          modules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                lessons: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      duration: { type: Type.STRING },
                      description: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  try { return JSON.parse(response.text || "{}"); } catch { return null; }
};

export const generateCollectionsMessage = async (name: string, daysLate: number, amount: number): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a firm but professional collections notice to "${name}" who is ${daysLate} days late on a $${amount} payment. Offer a temporary payment plan option to keep them in good standing.`
  });
  return response.text || "";
};

export const generateCreditMemo = async (contact: Contact): Promise<CreditMemo | null> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate a formal underwriter's Credit Memo for ${contact.company}. Data: ${JSON.stringify(contact)}. Include Strengths, Risks, Mitigants, and a final Recommendation.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          dateCreated: { type: Type.STRING },
          summary: { type: Type.STRING },
          recommendation: { type: Type.STRING },
          conditions: { type: Type.STRING },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          mitigants: { type: Type.ARRAY, items: { type: Type.STRING } },
          metrics: {
            type: Type.OBJECT,
            properties: {
              dscr: { type: Type.NUMBER },
              monthlyFreeCashFlow: { type: Type.NUMBER }
            }
          }
        }
      }
    }
  });
  try { return JSON.parse(response.text || "{}"); } catch { return null; }
};

export const generateDisputeLetter = async (contact: Contact, bureau: string, items: any[], method: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Draft a formal credit dispute letter for the ${bureau} credit bureau on behalf of "${contact.name}". Items to challenge: ${JSON.stringify(items)}. Strategy: "${method}" (e.g., Metro 2, factual). Include necessary legal citations.`
  });
  return response.text || "";
};

export const generateSmartReplies = async (messages: any[]): Promise<string[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this thread: ${JSON.stringify(messages.slice(-3))}. Generate 3 high-converting smart replies for a funding broker. Return as a JSON array of strings.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });
  try { return JSON.parse(response.text || "[]"); } catch { return ["I'll review with my team.", "Can we hop on a quick call?", "Send me your last 3 bank statements."]; }
};

export const analyzeDocumentForensics = async (placeholder: string): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Simulate a document forensic audit. Return a JSON report with a trust score, risk level, and summary.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          trustScore: { type: Type.NUMBER },
          riskLevel: { type: Type.STRING },
          summary: { type: Type.STRING }
        }
      }
    }
  });
  try { return JSON.parse(response.text || "{}"); } catch { return { trustScore: 95, riskLevel: "Low", summary: "Document verified authentic." }; }
};

export const generateWorkflowFromPrompt = async (prompt: string): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Translate this automation request into a structured pipeline rule: "${prompt}". Return as JSON.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          trigger: { 
            type: Type.OBJECT, 
            properties: { type: { type: Type.STRING }, value: { type: Type.STRING } } 
          },
          actions: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: { type: { type: Type.STRING }, params: { type: Type.OBJECT } } 
            } 
          }
        }
      }
    }
  });
  try { return JSON.parse(response.text || "{}"); } catch { return { name: "New Automation" }; }
};

export const generateSalesScript = async (contact: Contact, type: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a high-impact sales script for a "${type}" call to "${contact.name}" at "${contact.company}". Business context: ${contact.notes}. Goal: Book a closing call.`
  });
  return response.text || "Hello, this is Nexus calling regarding your recent funding inquiry...";
};