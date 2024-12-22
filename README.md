# Reaction

This project is a reimplementation of [isunjn/reaction](https://github.com/isunjn/reaction) on Azure, designed to support Zola-theme-serene's anonymous reaction API endpoint.

With this setup, you can deploy your own reaction endpoint on Azure.

**Cost**: For low-traffic sites, it should be free or cost less than $1 per month (primarily for [Azure Functions](https://azure.microsoft.com/en-us/services/functions) and [Azure Storage Table](https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-overview)).

## Stack

- Server Framework: [Hono](https://hono.dev)
- Server Environment: [Azure Functions](https://azure.microsoft.com/en-us/services/functions)
- Database: [Azure Storage Table](https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-overview)

## Prerequisites

- A Azure account
- Have `node` (alone with `npm` and `npx`) installed
- Have `pnpm` installed, you can install it by running `npm install -g pnpm` (Note: `pnpm` cannot be use with Azure Functions Windows, you need to use Azure Functions Linux)

## Instructions

1. Use this template to create a new repository of your own

2. Clone your repository to your local machine

3. Run `yarn install`

4. Config the environment variables in `.env` (you can copy `.env.example` to `.env` and fill in the values):
    ```bash
    EMOJIS=["👍", "👀", "😠"]
    ORIGINS=["*"]
    AZURE_TABLE_CONNECTION_STRING=<your-azure-storage-table-connection-string>
    ```

5. Deploy the worker
    - Make sure you created [Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-create-function-app-portal?pivots=programming-language-typescript) and Azure Storage Accounts, bassically Storage Account will be created automatically when you create Azure Functions and Azure Storage Table is one of the services in Azure Storage Account.
    - Run `func azure functionapp publish <your-function-app-name>`
    - Your deployed endpoint will be available at `https://<your-function-app-name>.azurewebsites.net`

6. In your zola site's `config.toml`:
    ```toml
    reaction = true
    reaction_align = "right"
    reaction_endpoint = "https://<your-function-app-name>.azurewebsites.net/api"
    ```


## Notes

- For detailed setup instructions, refer to the Azure documentation:
    - [Azure Functions Documentation](https://learn.microsoft.com/en-us/azure/azure-functions/)
    - [Azure Storage Table Overview](https://learn.microsoft.com/en-us/azure/storage/tables/table-storage-overview)

Feel free to open issues or contribute improvements!