---
title: Create Producer/Consumer Application for Kafka
author: tomtan@
date: 2020/2/2
description: In this post, we'll create Producer/Consumer apps to communicate with Kafka.
tags: kafka, japanese
---

# Create Producer/Consumer Application for Kafka

ここでは[Setup Apache Kafka - Confluent ver. (JPver.)](https://v2.tomtongue.com/blog/setup-kafka)で作成したKafka clusterに対しPub/Subを行うProducer/Consumer applicationを作成する。簡単のためまずはLocal上でAppを開発し、その後Kafka Cluster構築時に作成したAMIをベースにEC2を起動し、EC2上で対象のAppを稼働させる。具体的には以下の内容を実施する。

1. Initial setup
2. Running Producer app
3. Running Consumer app


なお使用したMaven ver.は以下 (Mavenのinstallは省略する。[Maven – Installing Apache Maven](http://maven.apache.org/install.html)を参照)。

```text
# Mac
$ mvn -version
Apache Maven 3.6.3 (cecedd343002696d0abb50b32b541b8a6ba2883f)
Maven home: /opt/apache-maven-3.6.3
Java version: 1.8.0_231, vendor: Oracle Corporation, runtime: /Library/Java/JavaVirtualMachines/jdk1.8.0_231.jdk/Contents/Home/jre
Default locale: en_IE, platform encoding: UTF-8
OS name: "mac os x", version: "10.14.6", arch: "x86_64", family: "mac"

# EC2
$ mvm -version
```

## 1. Initial setup
今回はProducer/Consumerとも同じApp directoryを使用するため、共通のpackage設定を行っておく。

```text
$ mvn archetype:generate -DarchetypeGroupId=org.apache.maven.archetypes \
-DarchetypeArtifactId=maven-archetype-simple -DgroupId=com.tomtongue.sample.kafkaapp \
-DartifactId=kafkaSampleApp \
-DinteractiveMode=false
[INFO] Scanning for projects...
Downloading from central: https://repo.maven.apache.org/maven2/org/apache/maven/plugins/maven-clean-plugin/2.5/maven-clean-plugin-2.5.pom
...
[INFO]
[INFO] ------------------< org.apache.maven:standalone-pom >-------------------
[INFO] Building Maven Stub Project (No POM) 1
[INFO] --------------------------------[ pom ]---------------------------------
[INFO]
[INFO] >>> maven-archetype-plugin:3.1.2:generate (default-cli) > generate-sources @ standalone-pom >>>
[INFO]
[INFO] <<< maven-archetype-plugin:3.1.2:generate (default-cli) < generate-sources @ standalone-pom <<<
[INFO]
[INFO]
[INFO] --- maven-archetype-plugin:3.1.2:generate (default-cli) @ standalone-pom ---
...
[INFO] ----------------------------------------------------------------------------
[INFO] Using following parameters for creating project from Archetype: maven-archetype-simple:1.4
[INFO] ----------------------------------------------------------------------------
[INFO] Parameter: groupId, Value: com.tomtongue.sample.kafkaapp
[INFO] Parameter: artifactId, Value: kafkaSampleApp
[INFO] Parameter: version, Value: 1.0-SNAPSHOT
[INFO] Parameter: package, Value: com.tomtongue.sample.kafkaapp
[INFO] Parameter: packageInPathFormat, Value: com/tomtongue/sample/kafkaapp
[INFO] Parameter: version, Value: 1.0-SNAPSHOT
[INFO] Parameter: package, Value: com.tomtongue.sample.kafkaapp
[INFO] Parameter: groupId, Value: com.tomtongue.sample.kafkaapp
[INFO] Parameter: artifactId, Value: kafkaSampleApp
[INFO] Project created from Archetype in dir: /<YOUR_DIR>
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  02:43 min
[INFO] Finished at: 2020-02-02T17:08:09Z
[INFO] ------------------------------------------------------------------------

$ tree kafkaSampleApp
kafkaSampleApp
├── pom.xml
└── src
    ├── main
    │   └── java
    │       └── com
    │           └── tomtongue
    │               └── sample
    │                   └── kafkaapp
    │                       └── App.java
    ├── site
    │   └── site.xml
    └── test
        └── java
            └── com
                └── tomtongue
                    └── sample
                        └── kafkaapp
                            └── AppTest.java

```

### Using InterlliJ IDEA
InterlliJでもproject作成できる。ここでは`InterlliJ IDEA 2019.3.2 (Community Edition)`を使用している。

![](/imgs/producer-consumer-kafka-app/kafka-app_intellij_1.png)
![](/imgs/producer-consumer-kafka-app/kafka-app_intellij_2.png)

以下のようなproject dirが作成される。

```
kafkaSampleAppIntellij
├── kafkaSampleAppIntellij.iml
├── pom.xml
└── src
    ├── main
    │   ├── java
    │   └── resources
    └── test
        └── java

6 directories, 2 files
```

今回はLocal上では`mvn` commandで作成したpackageをimportしてProducer/Consumer appを作成する。

Kafka clusterを[Setup Apache Kafka - Confluent ver. (JPver.)](https://v2.tomtongue.com/blog/setup-kafka)においてConfluent ver.で構築したので、今回もConfluet ver.のKafka Clientを使用する。Kafka Clientとしては、[Kafka Clients — Confluent Platform](https://docs.confluent.io/current/clients/index.html)に記載されているものがあるが、今回はJava clientを使用する。[Kafka Java Client — Confluent Platform](https://docs.confluent.io/current/clients/java.html)を参考に先ほど作成したprojectにおける`pom.xml`を以下のように記載する。

```xml
<?xml version="1.0" encoding="UTF-8"?>

<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
...
  <repositories>
    <repository>
      <id>confluent</id>
      <url>https://packages.confluent.io/maven/</url>
    </repository>
  </repositories>
...
  <dependencies>
    ...
    <dependency>
      <groupId>org.apache.kafka</groupId>
      <artifactId>kafka_2.12</artifactId>
      <version>5.4.0-ccs</version>
    </dependency>
  </dependencies>
...
<!-- (Option) For Fat Jar -->
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId> 
        <artifactId>maven-assembly-plugin</artifactId> <!-- Ref: https://maven.apache.org/plugins/maven-jar-plugin/ -->
        <version>3.2.0</version>
        <configuration>
          <descriptorRefs>
            <descriptorRef>jar-with-dependencies</descriptorRef>
          </descriptorRefs>
        </configuration>
        <executions>
          <execution>
            <phase>package</phase>
            <goals>
              <goal>single</goal>
            </goals>
          </execution>
        </executions>
      </plugin>
    </plugins>
...
  </build>
```

正常に実行できるか念の為この時点で試しておく。`App.java`を削除 (または変更)し、`./src/main/java`配下に`ProducerSample.java`というソースを作成する。

```java
package com.tomtongue.sample.kafkaapp;

import org.apache.kafka.clients.producer.*;
import java.util.Properties;

public class ProducerSample {
    public static void main(String[] args) {
        System.out.println("Hello Kafka");
    }
}

```

以下のように`Hello Kafka`が出力されるか確認する。

![](/imgs/producer-consumer-kafka-app/kafka-app_intellij_3.png)


## 2. Running Producer app
### 2-1. Development App on Local
ここではProducerのcodeを作成する。以下では単純に100回ほどKafkaに対しPublishするprogramである。先ほど作成した`produverSample.java`を以下のように記載する。`<HOSTNAME_NUM>`には`server.properties`で指定したhostnameを指定する必要があるが、今回はprivateDNSを指定したため、実際にpublishする場合にはKafka cluster側のhostnameを書き換えて起動し直す必要がある (多分この変更が一番楽なはず...?)。

```java
package com.tomtongue.sample.kafkaapp;

import org.apache.kafka.clients.producer.*;
import java.util.Properties;

public class ProducerSample {
    public static void main(String[] args) {
        Properties conf = new Properties();
        conf.setProperty("bootstrap.servers", "<HOSTNAME_1>:9092, <HOSTNAME_2>:9092, <HOSTNAME_3>:9092"); // !Specify!
        conf.setProperty("key.serializer", "org.apache.kafka.common.serialization.IntegerSerializer"); // For using Integer as a key
        conf.setProperty("value.serializer", "org.apache.kafka.common.serialization.StringSerializer"); // For using String as a value

        String topicName = "test-topic";
        Producer<Integer, String> producer = new KafkaProducer<>(conf);

        System.out.println("Start to send messages...\n");

        for(int i = 0; i < 100; i++) {
            String value = String.format("Message from Producer: #%s", i);
            producerSend(producer, topicName, i, value);
        }

        producer.close(); // Finish the producer
    }

    public static void producerSend(Producer<Integer, String> producer, String topic, int key, String value) {
        // Create payload
        ProducerRecord<Integer, String> payload = new ProducerRecord<>(topic, key, value);

        // Send message
        producer.send(payload, new Callback() {
            @Override
            public void onCompletion(RecordMetadata recordMetadata, Exception e) {
                if (recordMetadata != null) { // If success to send
                    String infoOutput = String.format("[INFO] Success: Partition: %s, Offset: %s", recordMetadata.partition(), recordMetadata.offset());
                    System.out.println(infoOutput);
                } else { // If fail to send
                    String errorOutput = String.format("[ERROR] Failed to send message: %s", e.getMessage());
                    System.out.println(errorOutput);

                }
            }
        });
    }
}

```

なお上記コードにおいて、K/Vを送信するにあたり、Kafka製のSerializerが必要となることに注意する (Consumer側はDeserが必要になることも注意する)。

ここでは一応Buildに成功することと、接続できている状況を確認する。正しく繋げていないと以下のようなエラーが発生する。

```text
Exception in thread "main" org.apache.kafka.common.KafkaException: Failed to construct kafka producer
	at org.apache.kafka.clients.producer.KafkaProducer.<init>(KafkaProducer.java:432)
	at org.apache.kafka.clients.producer.KafkaProducer.<init>(KafkaProducer.java:298)
	at com.tomtongue.sample.kafkaapp.ProducerSample.main(ProducerSample.java:14)
Caused by: org.apache.kafka.common.config.ConfigException: No resolvable bootstrap urls given in bootstrap.servers
	at org.apache.kafka.clients.ClientUtils.parseAndValidateAddresses(ClientUtils.java:88)
	at org.apache.kafka.clients.ClientUtils.parseAndValidateAddresses(ClientUtils.java:47)
	at org.apache.kafka.clients.producer.KafkaProducer.<init>(KafkaProducer.java:407)
	... 2 more

Process finished with exit code 1

```

### 2-2. Runnning App on EC2
先ほどのCodeをBuildし、JARファイルを作成する。[Package your application in a JAR - Help | IntelliJ IDEA](https://www.jetbrains.com/help/idea/packaging-a-module-into-a-jar-file.html)に具体的な方法が載っているので、詳細手順はこちらを参照 (なおMaven経由でBuildする場合はProject root dirにて、`mvn packag (-DskipTests)`を実行すれば良い)。

![](/imgs/producer-consumer-kafka-app/kafka-app_intellij_4.png)
![](/imgs/producer-consumer-kafka-app/kafka-app_intellij_5.png)


Buildしたのちに、作成されたJARファイルをAMIから作成したEC2インスタンスに移動させ、対象のJARファイルをこれから実行しProducerのテストを行う。事前に以下のようにConsumerを起動しておく。

```text
[ec2-user@ip-172-31-11-62 ~]$ kafka-console-consumer --bootstrap-server ip-172-31-14-76.ec2.internal:9092, ip-172-31-11-62.ec2.internal:9092, ip-172-31-6-79.ec2.internal:9092 --topic test-topic
```

Consumer側の準備が整ったらProducerからPublishしてみる。

```text
[ec2-user@ip-172-31-13-42 ~]$ java -cp ~/kafkaSampleApp.jar com.tomtongue.sample.kafkaapp.ProducerSample
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.
Start to send messages...

[INFO] Success: Partition: 1, Offset: 1
[INFO] Success: Partition: 1, Offset: 2
[INFO] Success: Partition: 1, Offset: 3
[INFO] Success: Partition: 1, Offset: 4
...
```

Consumer側で以下のようにmessageを取得できることも確認する。

```text
[ec2-user@ip-172-31-11-62 ~]$ kafka-console-consumer --bootstrap-server ip-172-31-14-76.ec2.internal:9092, ip-172-31-11-62.ec2.internal:9092, ip-172-31-6-79.ec2.internal:9092 --topic test-topic
Message sent from Producer: #0
Message sent from Producer: #3
Message sent from Producer: #4
Message sent from Producer: #9
Message sent from Producer: #10
...
```

## 3. Running Consumer app
Producer側で問題なく実行できたあとは、同様に以下のcodeで、Consumer Appも作成、BuildしてJARファイルを作成し、EC2上で実行する。

```java
package com.tomtongue.sample.kafkaapp;

import org.apache.kafka.clients.consumer.*;
import org.apache.kafka.common.TopicPartition;

import java.util.*;

public class ConsumerSample {
    public static void main(String[] args) {
        Properties conf = new Properties();
        conf.setProperty("bootstrap.servers", "<HOSTNAME_1>:9092, <HOSTNAME_2>:9092, <HOSTNAME_3>:9092"); // !Specify!
        conf.setProperty("group.id", "ConsumerSampleGroup");
        conf.setProperty("enable.auto.commit", "false");
        conf.setProperty("key.deserializer", "org.apache.kafka.common.serialization.IntegerDeserializer"); // For using Integer as a key
        conf.setProperty("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer"); // For using String as a value

        String topicName = "test-topic";
        Consumer<Integer, String> consumer = new KafkaConsumer<>(conf);

        // Set topic array
        List<String> topics = new ArrayList<>(1);
        topics.add(topicName);
        consumer.subscribe(topics);


        for(int i = 0; i < 200; i++) {
            ConsumerRecords<Integer, String> records = consumer.poll(1); // Deprecated
            for(ConsumerRecord<Integer, String> record: records) {
                printlnPayload(record);
                offsetCommit(record, consumer);
            }
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }

        }

    }

    // Output subscribed payload
    public static void printlnPayload(ConsumerRecord<Integer, String> record) {
        String payload = String.format("Received (%s, %s)", record.key(), record.value());
        System.out.println(payload);
    }

    // Commit offset
    public static void offsetCommit(ConsumerRecord<Integer, String> record, Consumer<Integer, String> consumer) {
        TopicPartition topicPartition = new TopicPartition(record.topic(), record.partition());
        OffsetAndMetadata offsetAndMetadata = new OffsetAndMetadata(record.offset() + 1);
        Map<TopicPartition, OffsetAndMetadata> commit = Collections.singletonMap(topicPartition, offsetAndMetadata);
        consumer.commitSync(commit);
    }
}
```


Producer同様にJARファイルを作成したら、以下のようにEC2上で実行する。また今回は簡単のため同じEC2 instanceから実行する。

**Producer**

```text
[ec2-user@ip-172-31-13-42 ~]$ java -cp ~/kafkaSampleApp.jar com.tomtongue.sample.kafkaapp.ProducerSample
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.
Start to send messages...

[INFO] Success: Partition: 1, Offset: 63
[INFO] Success: Partition: 1, Offset: 64
[INFO] Success: Partition: 1, Offset: 65
[INFO] Success: Partition: 1, Offset: 66
[INFO] Success: Partition: 1, Offset: 67
[INFO] Success: Partition: 1, Offset: 68
...
```

**Consumer**

```text
[ec2-user@ip-172-31-13-42 ~]$ java -cp ~/kafkaSampleApp.jar com.tomtongue.sample.kafkaapp.ConsumerSample
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.

Received (2, Message sent from Producer: #2)
Received (5, Message sent from Producer: #5)
Received (6, Message sent from Producer: #6)
Received (12, Message sent from Producer: #12)
Received (16, Message sent from Producer: #16)
Received (18, Message sent from Producer: #18)
...
```

