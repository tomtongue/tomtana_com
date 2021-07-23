---
title: Setup Apache Kafka - Confluent ver.
description: Let's setup a Kafka cluster!
date: 2020-02-02
author: tomtan@
tags: [kafka]
---

ここではKafka clusterやKafka clientなどのsetupを行う。具体的には以下のような構成で行う。

![](/assets/setup-kafka/kafka-cluster.png)

<!--truncate-->

Kafka自体には以下のようなDistributionがあり、今回はConfluent dist.を先に確認する (この後Community ver.のclusterも立ち上げる)。
* [Community ver.](https://kafka.apache.org/downloads) from Apache Software Foundation
* [Cofluent ver.](https://www.confluent.io/) from Cofluent
* [CDK (Clouera Distribution of Apacke Kafka)](https://docs.cloudera.com/documentation/kafka/latest/topics/kafka.html) from Cloudera
* [HDP (Hortonworks Data Platform)](https://docs.cloudera.com/HDPDocuments/HDP3/HDP-3.0.1/release-notes/content/patch_kafka.html)


なおCommunity ver.に関して、OSなどEnvironmental conditionは[Apache Kafka - Documentation: Operations](https://kafka.apache.org/documentation/#operations)に記載がある (Cofluent ver.も基本的にはCommunity ver.と同様)。

> From a security perspective, we recommend you use the latest released version of JDK 1.8 as older freely available versions have disclosed security vulnerabilities. LinkedIn is currently running JDK 1.8 u5 (looking to upgrade to a newer version) with the G1 collector. 

> Kafka should run well on any unix system and has been tested on Linux and Solaris.

また今回実施した環境については以下。
* Java: OracleJDK; Java SE Development Kit 8u241

```text
$ java -version
java version "1.8.0_241"
Java(TM) SE Runtime Environment (build 1.8.0_241-b07)
Java HotSpot(TM) 64-Bit Server VM (build 25.241-b07, mixed mode)
```

* OS: `Linux ip-172-31-14-76.ec2.internal 4.14.154-128.181.amzn2.x86_64 #1 SMP Sat Nov 16 21:49:00 UTC 2019 x86_64 x86_64 x86_64 GNU/Linux` (ami-062f7200baf2fa504, Amazon Linux2)

以下の手順で行う。最後に出くわしたエラーに関してTroubleshootingを記載している。

1. Setup AMI
    1. Install OracleJDK (ここはどちらも共通)
    2. Install Kafka (Community ver. or Cofluent dist.)
    3. Configure Kafka
    4. Create AMI
2. Running Kafka cluster
    1. Configuration for multiple nodes cluster
    2. Starting Kafka cluster
    3. Confirmation of running cluster
3. Stop the Kafka Cluster


## 1. Setup AMI
### 1-1. Install OracleJDK
[Java SE Development Kit 8 - Downloads](https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)よりrpm pacakgeを取得し、適当なdirectoryに配置する (ここではhome dirに配置している)。その後OracleJDK用の設定を以下の通り行う。

```text
[ec2-user@ip-172-31-14-76 ~]$ sudo rpm -ivh jdk-8u241-linux-x64.rpm
warning: jdk-8u241-linux-x64.rpm: Header V3 RSA/SHA256 Signature, key ID ec551f03: NOKEY
Preparing...                          ################################# [100%]
...
[ec2-user@ip-172-31-14-76 ~]$ echo 'export JAVA_HOME=/usr/java/default' >> .bashrc
[ec2-user@ip-172-31-14-76 ~]$ echo 'export PATH=$PATH:$JAVA_HOME/bin' >> .bashrc
[ec2-user@ip-172-31-14-76 ~]$ source .bashrc
[ec2-user@ip-172-31-14-76 ~]$ java -version
java version "1.8.0_241"
Java(TM) SE Runtime Environment (build 1.8.0_241-b07)
Java HotSpot(TM) 64-Bit Server VM (build 25.241-b07, mixed mode)
```

その他今後必要になるpackage;`git`を`yum`経由でインストールしておく。

### 1-2. Install Kafka
`yum`経由でKafka packageをinstallするため、まずはconfluentのrepoを以下の手順で登録する。AL2に関しては[Manual Install using Systemd on RHEL and CentOS — Confluent Platform](https://docs.confluent.io/current/installation/installing_cp/rhel-centos.html#systemd-rhel-centos-install)を参考にすると良い。

```text
[ec2-user@ip-172-31-14-76 ~]$ sudo rpm --import https://packages.confluent.io/rpm/5.4/archive.key
[ec2-user@ip-172-31-14-76 ~]$ cd /etc/yum.repos.d/
[ec2-user@ip-172-31-14-76 yum.repos.d]$ sudo vim confluent.repo
[ec2-user@ip-172-31-14-76 yum.repos.d]$ cat confluent.repo
[Confluent.dist]
name=Confluent repository (dist)
baseurl=https://packages.confluent.io/rpm/5.4/7
gpgcheck=1
gpgkey=https://packages.confluent.io/rpm/5.4/archive.key
enabled=1

[Confluent]
name=Confluent repository
baseurl=https://packages.confluent.io/rpm/5.4
gpgcheck=1
gpgkey=https://packages.confluent.io/rpm/5.4/archive.key
enabled=1
[ec2-user@ip-172-31-14-76 ~]$ sudo yum clean all
[ec2-user@ip-172-31-14-76 ~]$ yum list | grep -e confluent -e kafka
...
confluent-kafka-connect-elasticsearch.noarch
confluent-kafka-connect-jdbc.noarch    5.4.0-1                        Confluent
confluent-kafka-connect-jms.noarch     5.4.0-1                        Confluent
confluent-kafka-connect-replicator.noarch
confluent-kafka-connect-s3.noarch      5.4.0-1                        Confluent
...
```

上記でrepoが登録されたことが確認されたら、Confluent Platform OSSをまとめてインストールする (`confluent-oss-2.11`から名称が変わったっぽい)。

```text
[ec2-user@ip-172-31-14-76 ~]$ sudo yum install confluent-community-2.12 -y 
```

### 1-3. Configure Kafka
次にKafka側の設定を以下のように変更する。Data Dirを書き換える。

```text
[ec2-user@ip-172-31-14-76 ~]$ cd /etc/kafka
[ec2-user@ip-172-31-14-76 kafka]$ ls -a
.                                  connect-file-source.properties   producer.properties
..                                 connect-log4j.properties         server.properties
connect-console-sink.properties    connect-mirror-maker.properties  tools-log4j.properties
connect-console-source.properties  connect-standalone.properties    trogdor.conf
connect-distributed.properties     consumer.properties              zookeeper.properties
connect-file-sink.properties       log4j.properties
[ec2-user@ip-172-31-14-76 kafka]$ vim server.properties
[ec2-user@ip-172-31-14-76 kafka]$ sudo vim server.properties
# A comma separated list of directories under which to store log files # => 以下のように修正する
# log.dirs=/var/lib/kafka 
log.dirs=/var/lib/kafka/data

```

上記のように修正する理由としては、OracleJDKはJava Appを起動させた際に起動Userのhome dir (この場合は`/var/lib/kafka`)に実行情報を記録するためのDirを作成するが、Kafka Brokerは対象のDirにBrokerに関連のないファイルやDirが存在すると起動に失敗するためである。上記設定が完了したら、対象のDir: `/var/lib/kafka/data`を作成しておく。またBroker起動時のUser `cp-kafka`を対象のDirに追加しておく。

```text
[ec2-user@ip-172-31-14-76 ~]$ sudo chown cp-kafka:confluent /var/lib/kafka/data
```

Single Nodeでの稼働を行う際は上記設定で完了だが、今回はMultiple Nodesで稼働させるため、ここからZookeeper関連の設定を行う。

#### Additional Configuration for Running with Multiple Nodes
事前にZookeeperの設定を行なっておく。具体的には`etc/kafka/zookeeper.properties`に対し、以下の内容を追加する (`kafka-broker<NUM>`については後でインスタンスを3台起動させたのちに`hostname`に書き直す)。

```text
initLimit = 10
syncLimit = 5

server.1 = kafka-broker01:2888:3888
server.2 = kafka-broker02:2888:3888
server.3 = kafka-broker03:2888:3888
```

Zookeeperの上記parametersについては[ZooKeeper: Because Coordinating Distributed Systems is a Zoo](https://zookeeper.apache.org/doc/r3.5.6/zookeeperStarted.html#sc_RunningReplicatedZooKeeper)を確認すると良い。

> The new entry, initLimit is timeouts ZooKeeper uses to limit the length of time the ZooKeeper servers in quorum have to connect to a leader. The entry syncLimit limits how far out of date a server can be from a leader.
> With both of these timeouts, you specify the unit of time using tickTime. In this example, the timeout for initLimit is 5 ticks at 2000 milleseconds a tick, or 10 seconds.
> Finally, note the two port numbers after each server name: " 2888" and "3888". Peers use the former port to connect to other peers. Such a connection is necessary so that peers can communicate, for example, to agree upon the order of updates. More specifically, a ZooKeeper server uses this port to connect foll

`tickTime`のdefaultは 3000msec であるため、上記propertyにおいては、以下の秒数となる。
* `initLimit = 30sec (10 * 3000)`: ZooKeeper clusterの初期接続のtimeout値
* `syncLimit = 15sec (5 * 3000)`: Zookeeper clusterの同期timeout値

なお原因としては`sudo java`時にjavaのpathが見つかっていないと失敗するので以下の内容に事前に記載しておく。

```text
$ sudo visudo

# Defaults   env_keep += "HOME"
Defaults    secure_path = /sbin:/bin:/usr/sbin:/usr/bin:/usr/java/default/bin # ADD THIS CONFIG
```


### 1-4. Create AMI
以上で初期setupは完了なので、この時点でAMIを取得しておく (複数台稼働の場合にここで取得したAMIを使い回す)。

## 2. Running Kafka cluster
### 2-1. Configuration for multiple nodes cluster
まずは先ほど用意したAMIから追加で2台のインスタンスを起動し、これらを含めた合計3台のインスタンスをKafka Clusterとして使用する。また上記`zookeeper.properties`で記載したPort numberが通信可能かどうかについても確認しておく。

インスタンスの起動が完了したのちに、hostnameを`zookeeper.properties`に記載する。今回は以下の内容で記述している。

```text
server.1 = ip-172-31-14-76.ec2.internal:2888:3888
server.2 = ip-172-31-11-62.ec2.internal:2888:3888
server.3 = ip-172-31-6-79.ec2.internal:2888:3888
```

各serverに割り当てられた`id`を`/var/lib/zookeeper/myid`に記載する ([Manual Install using Systemd on RHEL and CentOS — Confluent Platform](https://docs.confluent.io/current/installation/installing_cp/rhel-centos.html#zk)を参照)。

```text
# Broker01
[ec2-user@ip-172-31-14-76 ~]$ echo 1 | sudo -u cp-kafka tee -a /var/lib/zookeeper/myid
1

# Broker02
[ec2-user@ip-172-31-11-62 ~]$ echo 2 | sudo -u cp-kafka tee -a /var/lib/zookeeper/myid
2

# Broker03
[ec2-user@ip-172-31-6-79 ~]$ echo 3 | sudo -u cp-kafka tee -a /var/lib/zookeeper/myid
3
```

この後Broker側で以下のように`/etc/kafka/server.properties`を変更する。

```text
...
# broker.id=0
broker.id = <1 | 2 | 3> # ここでは1-3と`myid`に合わせているが、`myid`と同じに設定する必要はない
broker.id.generation.enable = false
...
# zookeeper.connect=localhost:2181 # To
zookeeper.connect = ip-172-31-14-76.ec2.internal:2181, ip-172-31-11-62.ec2.internal:2181, ip-172-31-6-79.ec2.internal:2181
# => <ZooKeeper hostname>:<Port num> で指定する
...
```

以上で複数台serverで稼働させる際のsetupは完了。

### 2-2. Starting Kafka cluster
とりあえずここまでやってroot権限に対して`java`のPATHが登録されていないことに気づいたので、簡単のため`ec2-user`と同じ内容の`.bashrc`を利用し、実行した (なおdebug時は、`/bin` dirにおいて`sudo ./zookeeper-start-server /etc/kafka/zookeeper.properties`を実行するとわかりやすい)。`zookeeper-start-server`実行時には、内部で`kafka-run-class`が呼ばれるが、本スクリプトでは`$JAVA`のPATHを指定して実行しているので、`export JAVA=/usr/java/default`および`export PATH=$PATH:$JAVA_HOME/bin:$JAVA/bin`も追加する。

とりあえず直接スクリプト経由で呼ぶと成功することを確認した。

ここではZookeeperとKafka両方を立ち上げる。具体的には以下のコマンドを各Nodeで実行することで起動される (ただし今回は成功しなかったので`systemctl cat`から呼び出しているスクリプトを確認し、直接呼び出すことにした...)。Kafkaも同じようにして起動する。

```text
#  Zookeeper
[ec2-user@<ALL_HOST> ~]$ sudo systemctl start confluent-zookeeper -> Failed with status_code=127

[ec2-user@<ALL_HOST> ~]$ sudo systemctl cat confluent-zookeeper
# /usr/lib/systemd/system/confluent-zookeeper.service
...
User=cp-kafka
Group=confluent
ExecStart=/usr/bin/zookeeper-server-start /etc/kafka/zookeeper.properties

[ec2-user@<ALL_HOST> ~]$ sudo /usr/bin/zookeeper-server-start -daemon /etc/kafka/zookeeper.properties


# Kafka
[ec2-user@<ALL_HOST>]$ sudo /usr/bin/kafka-server-start -daemon /etc/kafka/server.properties
```

各Nodeにて以下のprocessが稼働しているか確認する (正常に稼働していると以下のようにプロセスが出力される)。

```text
[ec2-user@ip-172-31-14-76 ~]$ ps aux | grep kafka
root      8091  0.1  0.2 6001132 89052 pts/0   Sl   14:42   0:01 java -Xmx512M -Xms512M -server -XX:+UseG1GC -XX:MaxGCPauseMillis=20 -XX:InitiatingHea
pOccupancyPercent=35 -XX:+ExplicitGCInvokesConcurrent -Djava.awt.headless=true -Xloggc:/var/log/kafka/zookeeper-gc.log -verbose:gc -XX:+PrintGCDetails
 -XX:+PrintGCDateStamps -XX:+PrintGCTimeStamps -XX:+UseGCLogFileRotation -XX:NumberOfGCLogFiles=10 -XX:GCLogFileSize=100M -Dcom.sun.management.jmxremo
te -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false -Dkafka.logs.dir=/var/log/kafka -Dlog4j.configuration=fi
le:/etc/kafka/log4j.properties -cp /usr/bin/../share/java/kafka/*:/usr/bin/../support-metrics-client/build/dependant-libs-2.12.10/*:/usr/bin/../suppor
t-metrics-client/build/libs/*:/usr/share/java/support-metrics-client/* org.apache.zookeeper.server.quorum.QuorumPeerMain /etc/kafka/zookeeper.properties
root      9864  1.9  1.1 6864544 381212 ?      Sl   15:06   0:06 java -Xmx1G -Xms1G -server -XX:+UseG1GC -XX:MaxGCPauseMillis=20 -XX:InitiatingHeapOcc
upancyPercent=35 -XX:+ExplicitGCInvokesConcurrent -Djava.awt.headless=true -Xloggc:/var/log/kafka/kafkaServer-gc.log -verbose:gc -XX:+PrintGCDetails -
XX:+PrintGCDateStamps -XX:+PrintGCTimeStamps -XX:+UseGCLogFileRotation -XX:NumberOfGCLogFiles=10 -XX:GCLogFileSize=100M -Dcom.sun.management.jmxremote
 -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false -Dkafka.logs.dir=/var/log/kafka -Dlog4j.configuration=file
:/etc/kafka/log4j.properties -cp /usr/bin/../share/java/kafka/*:/usr/bin/../support-metrics-client/build/dependant-libs-2.12.10/*:/usr/bin/../support-
metrics-client/build/libs/*:/usr/share/java/support-metrics-client/* io.confluent.support.metrics.SupportedKafka /etc/kafka/server.properties
```

### 2-3. Confirmation of running cluster
最後に正常にKafka clusterが起動できているかについて確認する。今回はLeaderNode (id: 01)にて`kafka-topic` commandを実行しTopicを作成することで確認する。具体的には以下のクライアントにおいて確認する。基本的なcommandについては[Apache Kafka - Documentation](https://kafka.apache.org/documentation)に記載があるので参考にすると良い。
* Kafka client
* Producer
* Consumer

#### Kafka client
以下のコマンドを実行し、Topicを作成する。その後Topic一覧を取得する。なお、`--replication-factor`で指定する値についてはBroker数を上回っている場合エラーでコマンドが失敗するので注意する。

```text
[ec2-user@ip-172-31-14-76 ~]$ kafka-topics --zookeeper ip-172-31-14-76.ec2.internal:2181, ip-172-31-11-62.ec2.internal:2181, ip-172-31-6-79.ec2.internal:2181 \
> --create --topic test-topic --partitions 3 --replication-factor 3
Created topic test-topic.

[ec2-user@ip-172-31-14-76 ~]$ kafka-topics --zookeeper ip-172-31-14-76.ec2.internal:2181, ip-172-31-11-62.ec2.internal:2181, ip-172-31-6-79.ec2.internal:2181 \
> --describe --topic test-topic
Topic: test-topic	PartitionCount: 3	ReplicationFactor: 3	Configs:
	Topic: test-topic	Partition: 0	Leader: 3	Replicas: 3,1,2	Isr: 3,1,2
	Topic: test-topic	Partition: 1	Leader: 1	Replicas: 1,2,3	Isr: 1,2,3
	Topic: test-topic	Partition: 2	Leader: 2	Replicas: 2,3,1	Isr: 2,3,1
```


#### Producer & Consumer
Messageを送信するためのProducer Serverである、Kafka Console Producerを起動する。

```text
[ec2-user@ip-172-31-14-76 ~]$ kafka-console-producer --broker-list ip-172-31-14-76.ec2.internal:9092, ip-172-31-11-62.ec2.internal:9092, ip-172-31-6-79.ec2.internal:9092 \
> --topic test-topic
>
```

上記状態で待機するので、次に別のserverでConsumer Serverである、Kafka Console Consumerを起動する。

```text
[ec2-user@ip-172-31-11-62 ~]$ kafka-console-consumer --bootstrap-server ip-172-31-14-76.ec2.internal:9092, ip-172-31-11-62.ec2.internal:9092, ip-172-31-6-79.ec2.internal:9092 \
> --topic test-topic
```

Producer経由でmessageを送信するとConsumer側で確認できる。

```text
# Producer
[ec2-user@ip-172-31-14-76 ~]$ kafka-console-producer --broker-list ip-172-31-14-76.ec2.internal:9092, ip-172-31-11-62.ec2.internal:9092, ip-172-31-6-79.ec2.internal:9092 \
> --topic test-topic
>Hello Kafka!


# Consumer
[ec2-user@ip-172-31-11-62 ~]$ kafka-console-consumer --bootstrap-server ip-172-31-14-76.ec2.internal:9092, ip-172-31-11-62.ec2.internal:9092, ip-172-31-6-79.ec2.internal:9092 \
> --topic test-topic
Hello Kafka!
```

## 3. Stop the Kafka Cluster
Cluster停止時はKafka -> Zookeeperの順に行う (起動時と逆)

```text
# Kafka
[ec2-user@<ALL_HOST>]$ sudo /usr/bin/kafka-server-stop

# Zookeeper
[ec2-user@<ALL_HOST>]$ sudo /usr/bin/zookeeper-server-stop
```

## Troubleshooting
### Thrown `kafka.common.InconsistentBrokerIdException` when starting Kafka cluster

```text
[2020-02-01 23:08:44,686] ERROR Fatal error during KafkaServer startup. Prepare to shutdown (kafka.server.KafkaServer)
kafka.common.InconsistentBrokerIdException: Configured broker.id 2 doesn't match stored broker.id 3 in meta.properties. If you moved your data, make sure your configured broker.id matches. If you intend to create a new broker, you should remove all data in your data directories (log.dirs).
	at kafka.server.KafkaServer.getOrGenerateBrokerId(KafkaServer.scala:762)
	at kafka.server.KafkaServer.startup(KafkaServer.scala:223)
	at io.confluent.support.metrics.SupportedServerStartable.startup(SupportedServerStartable.java:114)
	at io.confluent.support.metrics.SupportedKafka.main(SupportedKafka.java:66)
[2020-02-01 23:08:44,688] INFO shutting down (kafka.server.KafkaServer)
```


上記のようなエラーが出力された場合、BrokerIdや`myid`の設定に誤りがないか確認し、以下の`meta.properties`を削除する。

```text
[root@ip-172-31-11-62 data]# ls -a
.   cleaner-offset-checkpoint      .kafka_cleanshutdown  log-start-offset-checkpoint  recovery-point-offset-checkpoint
..  __confluent.support.metrics-0  .lock                 meta.properties              replication-offset-checkpoint
[root@ip-172-31-11-62 data]# rm -rf meta.properties
```

## Reference
1. [Apache Kafka - Documentation](https://kafka.apache.org/documentation/)
2. [Manual Install using Systemd on RHEL and CentOS — Confluent Platform](https://docs.confluent.io/current/installation/installing_cp/rhel-centos.html#systemd-rhel-centos-install)
3. [ZooKeeper: Because Coordinating Distributed Systems is a Zoo](https://zookeeper.apache.org/doc/r3.5.6/zookeeperStarted.html#sc_RunningReplicatedZooKeeper)
4. [Apache Kafka 分散メッセージングシステムの構築と活用](https://www.shoeisha.co.jp/book/detail/9784798152370)