import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { KafkaConnectionAsyncOptions, KafkaConnectionOptions } from './interfaces/kafka-connection-options';
import { getAsyncKafkaConnectionProvider, getKafkaConnectionProvider, getKafkaConnectionProviderList } from './providers/kafka.connection';
import { KafkaService } from './services/kafka.service';

/**
 * @deprecated use `NodeRdKafkaModule` instead
 */
@Global()
@Module({})
export class KafkaModule {
  /**
   * Creates the connection to the kafka instance but is asynchronous instead.
   * @param options the options for the node-rdkafka connection.
   * @internal
   */
  static forRootAsync(options: KafkaConnectionOptions): DynamicModule {

    const connectionProvider = getKafkaConnectionProvider(options);
    // const asyncProviders = this.createAsyncProviders(options);
    return {
      module: KafkaModule,
      // imports: options.imports, // imports from async for root
      providers: [
        connectionProvider,
        KafkaService
      ],
      exports: [KafkaService, connectionProvider]
    };
  }

  /**
   * Cleans up the connection and removes the models to prevent unintended usage.
   * @internal
   */
  // async onApplicationShutdown() {
  //   const connection = this.moduleRef.get<any>(this.connectionName);

  //   if (connection) {
  //     await connection.close();
  //     [...models.entries()].reduce((array, [key, model]) => {
  //       if (model.db === connection) {
  //         array.push(key);
  //       }
  //       return array;
  //     }, []).forEach(deleteModel);
  //   }
  // }
}

export class NodeRdKafkaModule {

  /**
   * Creates the connection to the kafka instance.
   * @param options the options for the node-rdkafka connection.
   * @internal
   */
    static forRoot(options: KafkaConnectionOptions): DynamicModule {
      const connectionProvider = getKafkaConnectionProviderList(options);
  
      return {
        module: NodeRdKafkaModule,
        providers: [...connectionProvider, KafkaService],
        exports: [KafkaService, ...connectionProvider],
        global: options.global ?? true,
      };
    } 

  /**
   * Creates the connection to the kafka instance in an asynchronous fashion.
   * @param options the async options for the node-rdkafka connection.
   */
  static async forRootAsync(
    options: KafkaConnectionAsyncOptions,
  ): Promise<DynamicModule> {
    const providers: Provider[] = [
      ...getAsyncKafkaConnectionProvider(options),
      KafkaService,
    ];

    return {
      module: NodeRdKafkaModule,
      imports: options.imports,
      providers: providers,
      exports: providers,
      global: options.global ?? true,
    } as DynamicModule;
  }
}