# Azure Provider configuration
provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "webpubsub-rg"
  location = "EastUS"
}

# Azure Web PubSub Service
resource "azurerm_web_pubsub" "web_pubsub_service" {
  name                = "webpubsubservice"  # Name of the Web PubSub service
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku {
    name     = "Standard_S1"  # Free_F1 for dev
    capacity = 1
  }

  # Feature flag to enable the native Web PubSub API
  features {
    web_pubsub_api = true
  }
}

# Outputs for easy access to the service's details
output "web_pubsub_service_host" {
  description = "Web PubSub Service Hostname"
  value       = azurerm_web_pubsub.web_pubsub_service.hostname
}

output "web_pubsub_service_primary_key" {
  description = "Web PubSub Service Primary Key"
  value       = azurerm_web_pubsub.web_pubsub_service.primary_key
}

# TODO discuss with devOps team
# Role Assignment to give the Web App's Managed Identity access to the Web PubSub service
#resource "azurerm_role_assignment" "webapp_pubsub_role" {
#  scope                = azurerm_web_pubsub.pubsub.id
#  role_definition_name = "Azure Web PubSub Service Client"
#  principal_id         = azurerm_windows_web_app.webapp.identity[0].principal_id
#}