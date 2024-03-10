# nestjs-rdkafka

[![NPM](https://nodei.co/npm/nestjs-rdkafka.png)](https://www.npmjs.com/package/nestjs-rdkafka)

[![npm version](https://badge.fury.io/js/nestjs-rdkafka.svg)](https://badge.fury.io/js/nestjs-rdkafka)
[![Build & Test](https://github.com/andreacioni/nestjs-rdkafka/actions/workflows/main.yml/badge.svg)](https://github.com/andreacioni/nestjs-rdkafka/actions/workflows/main.yml)
![npm](https://img.shields.io/npm/dm/nestjs-rdkafka)
![npm bundle size](https://img.shields.io/bundlephobia/min/nestjs-rdkafka)  
[![Maintainability](https://api.codeclimate.com/v1/badges/53b44fd83fa37a8d7dba/maintainability)](https://codeclimate.com/github/a97001/nestjs-rdkafka/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/53b44fd83fa37a8d7dba/test_coverage)](https://codeclimate.com/github/a97001/nestjs-rdkafka/test_coverage)

## Description

A [NestJS](https://nestjs.com/) module wrapper for [node-rdkafka](https://github.com/Blizzard/node-rdkafka).

## Installation

```bash
npm i nestjs-rdkafka
```

## Basic usage

Initialize module with configuration of `consumer`, `producer` or `admin client` respectively. A full list of configuration can be found on `node-rdkafka`'s [Configuration](https://github.com/Blizzard/node-rdkafka#configuration) section.

**app.module.ts**

```typescript
import { Module } from "@nestjs/common";
import { NodeRdKafkaModule } from "nestjs-rdkafka"

@Module({
  imports: [
    NodeRdKafkaModule.forRoot({
      consumer: {
        conf: {
          "group.id": "kafka_consumer",
          "metadata.broker.list": "127.0.0.1:9092",
        },
      },
      producer: {
        conf: {
          "client.id": "kafka_prducer",
          "metadata.broker.list": "127.0.0.1:9092",
        },
      },
      adminClient: {
        conf: {
          "metadata.broker.list": "127.0.0.1:9092",
        },
      },
    })
  ],
})
export class ApplicationModule {}
```
It is possible to dynamically configure the module using `forRootAsync` method and pass, for instance, a `ConfigService` as shown below:

```typescript
import { Module } from "@nestjs/common";
import { NodeRdKafkaModule } from "nestjs-rdkafka"

@Module({
  imports: [
    NodeRdKafkaModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const groupId = configService.get("group_id");
        const brokerList = configService.get("metadata_broker_list");
        const clientId = configService.get("cliend_id");

        return {
          consumer: {
            conf: {
              "group.id": groupId,
              "metadata.broker.list": brokerList,
            },
          },
          producer: {
            conf: {
              "client.id": clientId,
              "metadata.broker.list": brokerList,
            },
          },
          adminClient: {
            conf: {
              "metadata.broker.list": brokerList,
            },
          },
        }
      },
      inject: [ConfigService]
    })
  ],
})
export class ApplicationModule {}
```


Starting Inject the `kafka.service` in other provider/service to get the consumer, producer and or client.

**cats.service.ts**

```typescript
import { Injectable } from "@nestjs/common";
import { KafkaService } from "nestjs-rdkafka";

@Injectable()
export class CatsService {
  constructor(private readonly kafkaService: KafkaService) {
    const consumer = this.kafkaService.getConsumer(); // consumer

    const producer = this.kafkaService.getProducer(); // producer

    const adminClient = this.kafkaService.getAdminClient(); // admin client

    /* Throw Error if you get any of these without configuration in module initialization */
  }
}
```
## Auto connect

By default, during `NodeRdKafkaModule` initialization, a connection attempt is done automatically. However this implies that if the broker connection is not available (broker is temporary down/not accessible) during startup, the NestJS initialization may fail.

## Disconnect

All clients will be automatically disconnected from Kafka `onModuleDestroy`. You can manually disconnect by calling:

```typescript
await this.consumer?.disconnect();
await this.producer?.disconnect();
await this.adminClient?.disconnect();
```

You may also use some utility functions from this library to safe close producer and consumer connection:

```typescript

import { Injectable, Module } from "@nestjs/common";

import { safeProducerDisconnect, safeConsumerDisconnect } from "nestjs-rdkafka"


@Injectable
export class MyService {
  async onModuleDestroy() {
    try {
      await safeConsumerDisconnect(this.consumer);
    } catch (err) {
      console.error(err);
    }

    try {
      await safeProducerDisconnect(this.producer);
    } catch (err) {
      console.error(err);
    }
  }
}

```

## License

nestjs-rdkafka is [MIT licensed](LICENSE).
