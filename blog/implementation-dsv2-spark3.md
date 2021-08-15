---
title: Implementation of DataSourceV2 APIs in Spark 3
date: 2021-08-11
author: Tom
authorURL: https://github.com/tomtongue
authorImageURL: https://avatars1.githubusercontent.com/u/43331405?s=400&v=4
draft: true
tags: [spark]
---

*The following code shows in Scala. The actual classes are implemented in Java.*

This post shows concrete relation map which you need in your implementing Spark connector for Spark 3.

<!-- truncate -->

The following interfaces (and methods) need to be implemented at least:
* Interface: `TableProvider`
    * `inferSchema`
    * `getTable`
* Interface: `Table`
    * `name`
    * `schema`
    * `capabilities`
    * Interface: [`SupportsRead`](https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/catalog/SupportsRead.html)
        * `newScanBuilder`
    * Interface: [`SupportsWrite`](https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/catalog/SupportsWrite.html)
        * `newWriterBuilder`

**Read**
* Interface: [`ScanBuilder`](https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/read/ScanBuilder.html)
    * `build`
        * Interface: [`Scan`](https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/read/Scan.html)
            * `readSchema`
            * `toBatch`
                * Interface: [`Batch`](https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/read/Batch.html)
                    * `createReaderFactory`
                        * Interface: [`PartitionReaderFactory`](https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/read/PartitionReaderFactory.html)
                            * `createReader` => Interface: [`PartitionReader`](https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/read/PartitionReader.html)
                    * `planInputPartitions` => Interface: [`InputPartition`](https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/read/InputPartition.html)

**Write**
* Interface: [`WriterBuilder`](https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/write/WriteBuilder.html)
    * `buildForBatch`
        * Interface: [`BatchWrite`](https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/write/BatchWrite.html)
            * `createBatchWriteFactory`
                * Interface: [`DataWriteFactory`](https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/write/DataWriterFactory.html)
                    * `createWriter` => Interface: [`DataWriter`](https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/write/DataWriter.html)
    * `buildForStreaming`
        * Interace: [`StreamingWrite`](https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/write/streaming/StreamingWrite.html)


---

## 1. `TableProvider`
* Src: https://github.com/apache/spark/blob/v3.1.1/sql/catalyst/src/main/java/org/apache/spark/sql/connector/catalog/TableProvider.java
* Doc: https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/catalog/TableProvider.html


```scala
// Blank implementation template
class DefaultSource extends TableProvider {
  override def inferSchema(caseInsensitiveStringMap: CaseInsensitiveStringMap): StructType = ???

  override def getTable(structType: StructType, transforms: Array[Transform], map: util.Map[String, String]): Table = ???
}
```

## 2. `Table`
* Src: https://github.com/apache/spark/blob/v3.1.1/sql/catalyst/src/main/java/org/apache/spark/sql/connector/catalog/Table.java
* Doc: https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/catalog/Table.html

Imporant notes from the src: 
>  This interface can mixin {@code SupportsRead} and {@code SupportsWrite} to provide data reading and writing ability.

```scala
// Blank implementation template
class MyTable extends Table {
  override def name(): String = ???

  override def schema(): StructType = ???

  override def capabilities(): util.Set[TableCapability] = ???
}
```

### About `TableCapability`
Execution mode in Spark 3: http://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/catalog/TableCapability.html
* Batch:
	* `BATCH_READ` / `BATCH_WRITE`
* Streaming:
	* `CONTINUOUS_READ`
	* `MICRO_BATCH_READ`
	* `STREAMING_WRITE` etc

### 2-1. `SupportsRead`
* Doc: https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/catalog/SupportsRead.html

### 2-2. `SupportsWrite`
* Doc: https://spark.apache.org/docs/3.1.1/api/java/org/apache/spark/sql/connector/catalog/SupportsWrite.html


## 2. `ScanBuilder`

### 2-1. `Scan`
Logical  representation interface (physical representation interface = `Batch`)
* https://github.com/apache/spark/blob/v3.1.1/sql/catalyst/src/main/java/org/apache/spark/sql/connector/read/Scan.java
* http://spark.apache.org/docs/latest/api/java/org/apache/spark/sql/connector/read/Scan.html

> A logical representation of a data source scan. This interface is used to provide logical information, like what the actual read schema is.


```scala
class MyScan extends Scan {
  override def readSchema(): StructType = ???
}
```


## 3. `WriterBuilder`

## 3. `Batch`
* http://spark.apache.org/docs/latest/api/java/org/apache/spark/sql/connector/read/Batch.html


> A physical representation of a data source scan for batch queries. This interface is used to provide physical information, like how many partitions the scanned data has, and how to read records from the partitions.


### 3-a. `InputPartition`

### 3-b-1.`PartitionReaderFactory`

```scala
class MyPartitionReaderFactory extends PartitionReaderFactory {
  override def createReader(inputPartition: InputPartition): PartitionReader[InternalRow] = ???
}
```

#### 3-b-2.`PartitionReader`

```scala
class MyPartitionReader extends PartitionReader[InternalRow] {
  override def next(): Boolean = ???

  override def get(): InternalRow = ???

  override def close(): Unit = ???
}

```

Useful links:
* http://blog.madhukaraphatak.com/spark-3-datasource-v2-part-3/
* https://levelup.gitconnected.com/easy-guide-to-create-a-custom-read-data-source-in-apache-spark-3-194afdc9627a
* https://gist.github.com/rafaelkyrdan/2bea8385aadd71be5bf67cddeec59581 -> step by step
* https://github.com/snowflakedb/spark-snowflake/blob/master/src/main/scala/net/snowflake/spark/snowflake/DefaultSource.scala -> Example
* [spark/sql/connector/read/package-summary](http://spark.apache.org/docs/latest/api/java/org/apache/spark/sql/connector/read/package-summary.html)