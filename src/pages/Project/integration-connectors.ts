import type { ProviderTypeId } from "@/api/agent"

export type IntegrationConnector = {
  id: ProviderTypeId
  name: string
  summary: string
  docsUrl: string
  logoUrl: string
  logoSizeClass?: string
}

export const INTEGRATION_CONNECTORS: IntegrationConnector[] = [
  {
    id: "clickup",
    name: "ClickUp",
    summary: "เชื่อมต่อกับ ClickUp task",
    docsUrl: "https://jam.dev/docs/integrations/clickup",
    logoUrl: "https://logosandtypes.com/wp-content/uploads/2023/03/ClickUp.png",
    logoSizeClass: "size-14",
  },
  {
    id: "github",
    name: "GitHub",
    summary: "เชื่อมต่อกับ issue in GitHub",
    docsUrl: "https://jam.dev/docs/integrations/github",
    logoUrl: "https://images.icon-icons.com/3685/PNG/512/github_logo_icon_229278.png",
    logoSizeClass: "size-7",
  },
  {
    id: "jira",
    name: "Jira",
    summary: "เชื่อมต่อกับ ticket in Jira",
    docsUrl: "https://jam.dev/docs/integrations/jira",
    logoUrl: "https://images.icon-icons.com/2429/PNG/512/jira_logo_icon_147274.png",
    logoSizeClass: "size-14",
  },
]

export function integrationConnectorById(
  id: ProviderTypeId,
): IntegrationConnector | undefined {
  return INTEGRATION_CONNECTORS.find((c) => c.id === id)
}
