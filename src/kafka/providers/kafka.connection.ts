import { Provider } from "@nestjs/common";
import * as rdkafka from "node-rdkafka";
import { KafkaAdminClientOptions } from "../interfaces/kafka-admin-client-options";
import {
  KafkaConnectionAsyncOptions,
  KafkaConnectionOptions,
} from "../interfaces/kafka-connection-options";
import { KafkaConsumerOptions } from "../interfaces/kafka-consumer-options";
import { KafkaProducerOptions } from "../interfaces/kafka-producer-options";
import { consumerConnect, producerConnect } from "../utils/kafka.utils";

export const KAFKA_CONNECTION_PROVIDER = "KafkaConnection";
export const KAFKA_ADMIN_CLIENT_PROVIDER = " KAFKA_ADMIN_CLIENT";

export interface KafkaConnectionProvider {
  adminClient: rdkafka.IAdminClient;
  consumer: rdkafka.KafkaConsumer;
  producer: rdkafka.Producer;
}

async function createConsumer(
  options: KafkaConsumerOptions,
): Promise<rdkafka.KafkaConsumer> {
  try {
    const consumer = new rdkafka.KafkaConsumer(options.conf, options.topicConf);

    if (options.autoConnect ?? true) {
      await consumerConnect(consumer, options.metadataConf);
    }

    return consumer;
  } catch (err) {
    throw err;
  }
}

async function createProducer(
  options: KafkaProducerOptions,
): Promise<rdkafka.Producer> {
  try {
    const producer = new rdkafka.Producer(options.conf, options.topicConf);

    if (options.autoConnect ?? true) {
      await producerConnect(producer, options.metadataConf);
    }
    return producer;
  } catch (err) {
    throw err;
  }
}

async function createAdminClient(
  options: KafkaAdminClientOptions,
): Promise<rdkafka.IAdminClient> {
  try {
    return rdkafka.AdminClient.create(options.conf);
  } catch (err) {
    throw err;
  }
}

export function getKafkaConnectionProvider(options: KafkaConnectionOptions) {
  return {
      provide: 'KafkaConnection',
      useFactory: async (): Promise<{ adminClient?: rdkafka.IAdminClient, consumer?: rdkafka.KafkaConsumer, producer?: rdkafka.Producer }> => {
          let adminClient: rdkafka.IAdminClient;
          let consumer: rdkafka.KafkaConsumer;
          let producer: rdkafka.Producer;

          return { 
              adminClient: options.adminClient ? await createAdminClient(options.adminClient) : adminClient,
              consumer: options.consumer ? await createConsumer(options.consumer) : consumer,
              producer: options.producer ? await createProducer(options.producer) : producer
          };
      }
  }
};

export function getKafkaConnectionProviderList(
  options: KafkaConnectionOptions,
): Provider[] {
  const adminClientPromise: Promise<rdkafka.IAdminClient> | undefined =
    options.adminClient && createAdminClient(options.adminClient);
  const consumerPromise: Promise<rdkafka.KafkaConsumer> | undefined =
    options.consumer && createConsumer(options.consumer);
  const producerPromise: Promise<rdkafka.Producer> | undefined =
    options.producer && createProducer(options.producer);
  return [
    {
      provide: KAFKA_CONNECTION_PROVIDER,
      useFactory: async (): Promise<KafkaConnectionProvider> => {
        return {
          adminClient: adminClientPromise && (await adminClientPromise),
          consumer: consumerPromise && (await consumerPromise),
          producer: producerPromise && (await producerPromise),
        };
      },
    },

    {
      provide: rdkafka.Producer,
      useFactory: async (
        kafkaConnectionProvider: Promise<KafkaConnectionProvider>,
      ): Promise<rdkafka.Producer> => {
        return (await kafkaConnectionProvider).producer;
      },
      inject: [KAFKA_CONNECTION_PROVIDER],
    },
    {
      provide: rdkafka.KafkaConsumer,
      useFactory: async (
        kafkaConnectionProvider: Promise<KafkaConnectionProvider>,
      ): Promise<rdkafka.KafkaConsumer> => {
        return (await kafkaConnectionProvider).consumer;
      },
      inject: [KAFKA_CONNECTION_PROVIDER],
    },
    {
      provide: KAFKA_ADMIN_CLIENT_PROVIDER,
      useFactory: async (
        kafkaConnectionProvider: Promise<KafkaConnectionProvider>,
      ): Promise<rdkafka.IAdminClient> => {
        return (await kafkaConnectionProvider).adminClient;
      },
      inject: [KAFKA_CONNECTION_PROVIDER],
    },
  ];
}

export function getAsyncKafkaConnectionProvider(
  options: KafkaConnectionAsyncOptions,
): Provider[] {
  return [
    {
      provide: KAFKA_CONNECTION_PROVIDER,
      inject: options.inject,
      useFactory: async (...args: any[]): Promise<KafkaConnectionProvider> => {
        let adminClient: rdkafka.IAdminClient;
        let consumer: rdkafka.KafkaConsumer;
        let producer: rdkafka.Producer;

        const connectionOptions = await options.useFactory(...args);

        return {
          adminClient: connectionOptions.adminClient
            ? await createAdminClient(connectionOptions.adminClient)
            : adminClient,
          consumer: connectionOptions.consumer
            ? await createConsumer(connectionOptions.consumer)
            : consumer,
          producer: connectionOptions.producer
            ? await createProducer(connectionOptions.producer)
            : producer,
        };
      },
    },
    {
      provide: KAFKA_ADMIN_CLIENT_PROVIDER,
      useFactory: async (
        provider: Promise<KafkaConnectionProvider>,
      ): Promise<rdkafka.IAdminClient> | undefined => {
        return (await provider).adminClient;
      },
      inject: [KAFKA_CONNECTION_PROVIDER],
    },
    {
      provide: rdkafka.KafkaConsumer,
      useFactory: async (
        provider: Promise<KafkaConnectionProvider>,
      ): Promise<rdkafka.KafkaConsumer> | undefined => {
        return (await provider).consumer;
      },
      inject: [KAFKA_CONNECTION_PROVIDER],
    },
    {
      provide: rdkafka.Producer,
      useFactory: async (
        provider: Promise<KafkaConnectionProvider>,
      ): Promise<rdkafka.Producer> | undefined => {
        return (await provider).producer;
      },
      inject: [KAFKA_CONNECTION_PROVIDER],
    },
  ];
}
