import { GraphbackCoreMetadata, GraphbackPlugin, ModelDefinition } from '@graphback/core'
import { GraphQLSchema } from 'graphql';
import { writeDocumentsToFilesystem } from './helpers/writeDocuments';
import { createClientDocumentsGQL, createClientDocumentsGqlComplete, createClientDocumentsTS } from './templates'
import { ClientTemplates } from './templates/ClientTemplates'

/**
 * Configuration for client generator
 */
export interface ClientGeneratorPluginConfig {
    /**
     * Output language that will be supported
     * Our plugin supports multiple languages for simplicity
     *
     * - ts - typescript file output (backwards compatibility)
     * - gql - .graphql file
     * - gqlwithfragment - complete gql queries containing fragments for redundancy
     */
    format: 'ts' | 'gql' | 'gqlwithfragment'

    /**
     * RelativePath for the output files created by generator
     */
    outputPath: string
}

export const CLIENT_CRUD_PLUGIN = "ClientCRUDPlugin";

/**
 * Graphback CRUD operations plugin
 * 
 * Plugins generates client side documents containing CRUD operations:
 * Queries, Mutations and Subscriptions that reference coresponding schema and resolves.
 * Plugin operates on all types annotated with model
 * 
 * Used graphql metadata:
 * 
 * - model: marks type to be processed by CRUD generator
 * - crud: controls what types of operations can be generated. 
 * For example crud.update: false will disable updates for type
 */
export class ClientCRUDPlugin extends GraphbackPlugin {
    private pluginConfig: ClientGeneratorPluginConfig;
    private documents: ClientTemplates;

    constructor(pluginConfig?: ClientGeneratorPluginConfig) {
        super()
        this.pluginConfig = Object.assign({ outputFormat: 'ts' }, pluginConfig);

    }

    public init(metadata: GraphbackCoreMetadata): void {
        const models = metadata.getModelDefinitions();
        if (models.length === 0) {
            this.logWarning("Provided schema has no models. No client side queries will be generated")
        }

        this.documents = this.createDocuments(models);
    }

    public generateResources(): void {
        const outputFormat = this.pluginConfig.format === 'gqlwithfragment' ? 'gql' : this.pluginConfig.format;

        writeDocumentsToFilesystem(this.pluginConfig.outputPath, this.documents, outputFormat);
    }

    public getPluginName(): string {
        return CLIENT_CRUD_PLUGIN;
    }

    private createDocuments(models: ModelDefinition[]) {
        let documents: ClientTemplates;

        if (this.pluginConfig.format === 'ts') {
            documents = createClientDocumentsTS(models);
        }
        else if (this.pluginConfig.format === 'gql') {
            documents = createClientDocumentsGQL(models);
        }
        else if (this.pluginConfig.format === 'gqlwithfragment') {
            documents = createClientDocumentsGqlComplete(models);
        } else {
            throw new Error("Invalid output format for client plugin");
        }

        return documents;
    }
}
