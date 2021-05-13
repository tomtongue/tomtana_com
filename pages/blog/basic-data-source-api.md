---
title: Basic of DataSource API in Spark
date: 2020/10/3
description: Understaning about Spark DataSources API.
tag: spark, japanese
author: tomtan@
---

# Basic of DataSource API in Spark

以下の内容については基本的に[Spark: The Definitive Guide](https://www.oreilly.com/library/view/spark-the-definitive/9781491912201/)の内容をベースとしており、一部必要な情報については他のリソースから付け足している。今回はChapter9 Data Sourcesをベースとし、内容をまとめているあ。大まかな流れとしては以下。

1. [DataSource API](#1-data-sources-api)
    1. Read API
    2. Write API
2. [For CSV](#2-for-csv)
3. [For JSON](#3-for-json)
4. [For Parquet](#4-for-parquet)
5. [For ORC](#5-for-orc)
6. [For SQLDatabases](#6-for-sqldatabases) - Reading & Writing, and QueryPushdown
7. [For Text Files](#7-for-text-files)
8. [Advanced Topics for Read/Write](#8-advanced-topics-for-readwrite) - File format & Compression, Reading & Writeing data in parallel, Writing complex types and Managing file size

Sparkは様々なData Sourceに対応しており、以下の6つのData Sourceをcore (CSV, Json, Parquet, ORC, JDBC/ODBC Connections, Plain-text files)とし、その他Communityより作成されたものも使用できる。Community-basedなData Sourceとしては、Cassandra, HBase, MongoDB, Redshift, XMLなどがある。
以下サンプルコードについては全てPySparkで記載している。

## 1. Data Source API
### 1-1. Read API
以下がReadにおけるCore API Strucureである。

```py
# READ
DataFrameReader.format("<Format>")
    .option("key", "value")
    .schema("Schema").load()
```

* `format` (optional): SparkではDefaultで**Parquet format**が使用される
* `option` (optional): K-Vで読み込み時のparameterを渡すことができる (CSVの場合にheaderを無視するなど)
* `schema` (optional): Schemaを指定したい、あるいはSchemaを強制したい場合はこのoptionを利用すると良い (指定しないとScalaベースのType inferenceが行われる)

実際にデータを読み込む際のサンプルコードは以下。

```py
spark.read.format("csv")
    .option("mode", "FAILFAST")
    .option("inferSchema", "true") # For unstructured format
    .option("path", "<PATH>")
    .schema(tableSchema).load()
```

Read dataを行う際は`SparkSession` instanceを介し、`DataFrameReader` classの`read` methodを利用して行われる (ex. `spark.read`)。Readの際は上記例のよう以下のようなパラメータを指定できる。

* Format
* Schema
* Read mode (以下に各modeについて記載)
* Options

なお外部リソースからデータを読む際の取り扱いについて、Read modeにより指定することができる (上記サンプルコードでは`FAILFAST` modeを指定している)。

| Read mode | Description |
|:-|:-|
| `PERMISSIVE` | **(Default)** Corrupted records (Stringでも正しく読み込めないRecord)を`null`とする |
| `DROPMALFORMED` | Malformed records (読み込めない型などがあり`null`と判定されてしまうrecordsなど)があった場合、対象のRecordをdropさせる |
| `FAILFAST` |  Malformed records (読み込めない型などがあり`null`と判定されてしまうrecordsなど)があった場合にReadをfailさせる |

### 1-2. Write API
以下がWriteにおけるCore API Strucureである。

```py
# Write
DataFrameWriter.format("<Format>")
    .option("key", "value")
    .partitionBy("<partitionKey>")
    .bucketBy("<bucketKey>")
    .sortBy("<sortKey>").save()
```

* `format` (optional): SparkではDefaultで**Parquet format**が使用される
* `option` (optional): K-Vで読み込み時のparameterを渡すことができる (書き込み時のcompression formatを指定したりできる)
* `partitionBy`, `bucketBy`, `sortBy` (optional): Partitionを指定、Bucketing、Sortingを行い書き込むことができる

実際にデータを読み込む際のサンプルコードは以下。

```py
dataframe.write.format("csv")
    .option("mode", "OVERWRITE")
    .option("dateFormat", "yyyy-MM-dd")
    .option("path", "<PATH>").save()
```

Write dataについてもRead data時とほぼ同様に、`DataFrameWriter` classの`write` methodを利用する。ただし、DataFrameに対しこのmethodを発行する (ex. `df.write`)。なおRead時同様Write mode (Save mode)を指定することができる (以下)。

| Save mode | Description |
|:-|:-|
| `append` | 出力先Locationにおける既存fileがあった場合でもそのままfileを追加する |
| `overwrite` | 出力先Locationに同様のデータがあった場合は上書きする |
| `errorIfExists` | **(Default)** 出力先Locationに既にfileが存在していた場合、ErrorとなりApplicationが失敗する |
| `ignore` | 出力先Locationに同様のデータがあった場合は、既存のデータを残し、書き込みを行わない |

## 2. For CSV
csvはcomma separatedでない場合 (tsvの場合)もあり、様々なoptionが用意されている。[CSV Files — Databricks Documentation](https://docs.databricks.com/data/data-sources/read-csv.html)にも記載があるのでここを確認するとよい。

```py
# Read
spark.read.format("csv").load("<PATH>")

# Write
dataframe.write.format("csv").mode("<MODE>").save("<PATH>")
```

|Read or Write?| Key | Values | Default | Short Description |
|:-:|:-:|:-:|:-:|:-:|
| **Both** | `sep` | *Any single string character* | `,` | updt
| **Both** | `header` | `true`, `false` | `false` | updt
| **Both** | `nullValue` | *Any string character* | `""` | updt
| **Both** | `nanValue` | *Any string character* | `NaN` | updt
| **Both** | `positiveInf` | *Any string or character* | `Inf` | updt
| **Both** | `negativeInf` | *Any string or character* | `-Inf` | updt
| **Both** | `compression` or `codec` | *None*, `uncompressed`, `bzip2`, `deflate`, `gzip`, `lz4`, or `snappy` | none | updt
| **Both** | `dateFormat` | *Any string or character that conforms to java's `SimpleDataFormat`* | `yyyy-MM-dd` | updt
| **Both** | `timestampFormat` |  *Any string or character that conforms to java's `SimpleDataFormat`* | `yyyy-MM-ddTHH:mm:ss.SSSZ` | updt
| Read | `escape` | *Any string character* | `\` | updt
| Read | `inferSchema` | `true`, `false` | `false` | updt
| Read | `ignoreLeadingWhiteSpace` | `true`, `false` | `false` | updt
| Read | `ignoreTrailingWhiteSpace` | `true`, `false` | `false` | updt
| Read | `maxColumns` | *Any integer* | 20480 | updt
| Read | `maxCharsPerColumn` | *Any integer* | 1000000 | updt
| Read | `escapeQuotes` | `true`, `false` | `true` | updt
| Read | `maxMalformedLogPerPartition` | *Any integer* | 10 | updt
| Read | `multiLine` | `true`, `false` | `false` | updt
| *Write* | `quoteAll` | `true`, `false` | `false` | updt

上記optionを使用しRead/Writeした際の例については以下。

```py
# Read
spark.read.format("csv").option("header", "true").option("mode", "FAILFAST").schema(schema).load("<PATH>")

# Write
dataframe.write.format("csv").mode("overwrite").option("sep", "\t").save("<PATH>")
```

## 3. For JSON
JSONを扱う場合には、基本的に**line-delimited**なものが、multilineの場合よりも安定して使用できるのでこちらを利用すると良い。Spark DataFrameでmultiline JSON fileをReadする際は、`multiLine` optionを`true`に設定し、全体をJSON objectとして読む必要がある。以下にRead/Writeに関するの基本について記載する。

```py
# Read 
spark.read.format("json")

# Write
dataframe.write.format("json").mode("<MODE>").save("<PATH>")
```

JSON optionに関して以下に示す。なお[JSON Files — Databricks Documentation](https://docs.databricks.com/data/data-sources/read-json.html)に詳細についてまとめてあるので、こちらも確認するとよい。

|Read or Write?| Key | Values | Default | Short Description |
|:-:|:-:|:-:|:-:|:-:|
| **Both** | `compression` or `codec` | *None*, `uncompressed`, `bzip2`, `deflate`, `gzip`, `lz4`, or `snappy` | none | updt
| **Both** | `dateFormat` | *Any string or character that conforms to java's `SimpleDataFormat`* | `yyyy-MM-dd` | updt
| **Both** | `timestampFormat` |  *Any string or character that conforms to java's `SimpleDataFormat`* | `yyyy-MM-ddTHH:mm:ss.SSSZ` | updt
| Read | `primitiveAsString` | `true`, `false` | `false` | updt
| Read | `allowComments` | `true`, `false` | `false` | updt
| Read | `allowSingleQuotes` | `true`, `false` | `true` | updt
| Read | `allowNumericLeadingZeros` | `true`, `false` | `false` | updt
| Read | `allowBackslashEscapingAnyCharacter` | `true`, `false` | `false` | updt
| Read | `columnNameOfCorruptRecord` | *Any string* | Value of `spark.sql.column&NameOfCorruptedRecord` | updt
| Read | `multiLine` | `true`, `false` | `false` | updt

基本的にはcsvと同様で、optionがJSON specificなものがあると考えれば良い。

## 4. For Parquet
Parquet formatはOpen source columnar formatであり、様々なStorageで最適化がなされており、storage spaceも節約でき、読み出しも早い、かつSparkでもDefaultとしてparquetを採用しているため、利用が推奨される。Parquetに対するRead/Writeについては以下のようにして行うことができる。

```py
# Read
spark.read.format("parquet").load("<PATH>")

# Write
dataframe.write.format("parquet").mode("<MODE>").save("<PATH>")
```

またParquetに関してはoptionがほとんどなく、[Parquet Files - Spark 2.4.4 Documentation](https://spark.apache.org/docs/latest/sql-data-sources-parquet.html)に記載があるのでこちらを確認すると良い (以下に重要なものを列挙する)。Parquetの場合は、Schema情報がfile metadataとして含まれているので、Schemaも保持しながらRead/Writeすることができる。
* `spark.sql.parquet.compression.codec` (Default: `snappy`): bzip2, gzip, lz4などWrite時のcompressionを選べる
* `spark.sql.parquet.filterPushdown` (Default: `true`): Parquet filter-pushdown optimizationを有効化できる
* `spark.sql.hive.convertMetastoreParquet` (Default: `true`): `false`に設定すると、SparkSQLがBuilt-inのSerdeではなくHive Serdeを使用する
* `spark.sql.parquet.mergeSchema` (Default: `false`): `true`に設定すると、Readしたファイルにschemaが複数ある場合は、それらをmergeしながらreadすることができる

## 5. For ORC
ORCは、self-describing, type-awareなcolumnar file formatである。Large streaming readsに最適化されており、Hiveと親和性が高い。SparkはParquetに最適化されているため、Parquetの利用が推奨される。

```py
# Read
spark.read.format("orc").load("<PATH>")

# Write
dataframe.write.format("orc").mode("<MODE>").save("<PATH>")
```

ORCに関してはoptionが2つのみで、詳細については[ORC Files - Spark 2.4.4 Documentation](https://spark.apache.org/docs/latest/sql-data-sources-orc.html)を確認すると良い。

## 6. For SQLDatabases
DataSourcesAPIを利用することで、RDBMSに対しても接続し、データをRead/Writeすることができる。代表的なエンジンとしてはMySQL, Postgres, OracleそしてSQLiteなど接続することが可能である (SQLiteの場合username/passwordは必要ない)。なおSQLDatabasesに対しRead/Writeするにあたり、以下の2つが必要。

1. JDBC Driverを含めること
2. 適切なJAR fileをDriver classに渡すこと

```text
// Example
./bin/spark-shell \
--driver-class-path postgresql-9.4.1207.jar \
--jars postgresql-9.4.1207.jar
```

その他`.option()`として以下のoptionを指定することができる。なお以下のTableではSpark2.4.4におけるoptionを列挙しているが、それぞれ簡単な説明にとどめている。詳細は[JDBC To Other Databases - Spark 2.4.4 Documentation](https://spark.apache.org/docs/latest/sql-data-sources-jdbc.html) or src: [spark/JDBCOptions.scala at master · apache/spark · GitHub](https://github.com/apache/spark/blob/master/sql/core/src/main/scala/org/apache/spark/sql/execution/datasources/jdbc/JDBCOptions.scala)を確認すると良い。

| Options | Example | Short Description |
|:-:|:-:|:-:|
| `url` | `.option("url" "jdbc:postgresql://<Database_server>")` | 接続先JDBC URL |
| `dbtable` | `option("dbtable", "<(schema.)TABLE_NAME> or <PUSHDOWN_QUERY>")` | Read/WriteするTable名で、PushdownQueryを挿入することもできる。ただし`query` optionと同時にqueryを挿入することは許されていない |
| `query` | `.option("query", "(ex. SELECT col1 FROM table)")`  | Read時にQueryを発行することができ、これに基づきデータがReadされる。ただし制約が2点ほどあり、`dbtable`と同時に使用できないことに加え、`partitionColumn`も同時に使用できない。もし`partitionColumn`を同時に使用する必要がある場合は、`dbtable`とセットで使用する |
| `driver` | `.option("driver", "com.mysql.jdbc.Driver")` | 指定したURLに接続するためのJDBC driver ClassName |
| `partitionColumn`, `lowerBound`, `upperBound` | `.option("partitionColumn", "user_id").option("lowerBound", 2L).option("upperBound", 1000L)` | `numPartitions` と合わせて利用し、Tableをどう並列で読むかを決める。`partitionColumn`はnumeric, date or timestampを指定する必要がある。また`lower/upperBound`でどの範囲のRowを対象とするかを決められる (ただしfilteringには使用できず、全Rowを対象にデータは取得する) |
| `numPartitions` | `.option("numPartitions, 20")` | Read/Write時の最大並列度を指定する。なお指定した数分のJDBCconnectionが作成されるためRDBMS側のConnection数に注意する
| `queryTimeout` | `.option("queryTimeoput", 10)` | （Default: 0) DriverがQuery statementが実行されることを待つ秒数。0にセットした場合にtimeoutなしとなる。Write時に関して、本optionにおける値はJDBC driverにおける`setQueryTimeout` APIの実装に依存する (どのタイミングをtimeoutとするかなど) |
| `fetchsize` | `.option("fetchsize", 100)` | 1度に何行読み込むかを決める。小さすぎる場合はround tripが何度も行われるためLatencyが増加し、大きすぎる場合はOOM発生の可能性がある。詳細については[Reference](#reference) "2."を参照
| `batchsize` | `.option("batchsize", 100)` | (Default: 1000) 1度に何行書き込むかを決める。小さすぎる場合はround tripが何度も行われるためLatencyが増加し、大きすぎる場合はRDBMS側のCPUが向上する可能性がある。
| `isolationLevel` | `.option("isolationLevel", "(ex. READ_COMMITED")`  | (**For Write**, Default: `READ_UNCOMMITED`) 対象のconnectionにおけるTransaction isolation levelが指定できる (`NONE`, `READ_COMMITED`, `READ_UNCOMMITED`, `REPEATABLE_READ` or `SERIALIZABLE`). 詳細については[Connection (Java Platform SE 8)](https://docs.oracle.com/javase/jp/8/docs/api/java/sql/Connection.html)を確認。
| `sessionInitStatement` | `option("sessionInitStatement", """BEGIN execute immediate 'alter session set "_serial_direct_read"=true'; END;""")` | 各Databaseに接続し、Readする前のcustom SQL statementを実行するためのoption. session initialization codeを設定できる。| 
| `truncate` | `.option("truncate", "True or False")` | (**For Write**, Default: `False`) `SaveMode.Overwrite`が有効である場合に、Sparkが既存のTableをtruncateするように作用する。
| `cascadeTruncate` | `.option("cascadeTruncate", True or False)` |  (**For Write**, currently support for Postgres & Oracle) 本optionを有効化した場合、`TRUNCATE TABLE t CASCADE`の実行が可能となる (Postgresの場合は`TRUNCATE TABLE ONLY t CASCADE`が実行され、Descendantが意図せずTruncateされることを防ぐ)。本optionは他のTableに影響を与える可能性があるため注意して使用する必要がある。各JDBC resourceにおける`isCascadeTruncate`にて指定されているCascading truncate behaviroがデフォルトの動作となる (実際ソースコードでも`isCacadeTruncate`を渡している)。
| `createTableOptions` | `.option("createTableOptions", "(ex. CREATE TABLE t (name string) ENGINE=InnoDB.)")` | (**For Write**) 本optionを指定すると、Database Table作成時に、database-specificなtableやpartition optionに関する設定を行うことができる
| `createTableColumnTypes` | `.option("createTableColumnTypes", "name CHAR(64), comments VARCHAR(1024)")` | (**For Write**) `CREATE TABLE`時にdatabase column data typesを (Default typesではなく)指定することができる。 | 
| `customSchema` | `.option("customSchema", "(ex. id DECIMAL(38, 0), name STRING)")` | (For **Read**) JDBC connection経由でデータを読む際にcustom schemaを指定することができる。また部分的にfieldを指定することもでき、それ以外はdefaultのtypeが利用される。
| `pushDownPredicate` | `.option("pushDownPredicate", True or False)` | (Default: `True`) JDBCリソースへのpushdown predicateを有効/無効にするoption. `False`にした場合は、FilterがJDBCリソース側でpushdownされないため、Spark側でFilterが全て行われる。通常pushdown predicateは、JDBCリソース側よりもSparkが早い場合、turn offされる。


### Reading from SQLDatabases
SQLDatabasesからデータをReadingする際には以下の事前準備を行う。

1. Connection propertiesを設定する - driver, path, jdbcUrl, tableName等
2. Test connection - 以下のようなサンプルコード (Scala)をDriver上で実行することでTestできる

```scala
import java.sql.DriverManager

val connection = DriverManager.getConnection(jdbcUrl)
connection.isClosed()
connection.close()
```

上記でConnectionが成功したのちに、他DataSourcesと同様にReadし、DataFrameを作成することができる。

```py
# MySQL case
jdbcDf = spark.read.format("jdbc") \
    .option("driver", "com.mysql.jdbc.Driver") \
    .option("url", "<jdbcUrl>/<DatabaseName>") \
    .option("dbtable", "<TableName>") \
    .option("user", "<UserName>") \
    .option("password", "<Password>").load() # Using `load()`

# Or, using `.jdbc()`
jdbcDf_2 = spark.read.option("IF NEEDED") \
    .jdbc("<jdbcUrl>", "<DatabaseName>.<TableName>", properties={"user": "<UserName>", "password": "<Password>"})
```

### Writing to SQLDatabases
WriteについてもRead同様にConnection properties等を指定し、以下のように書き込むことができる。

```py
jdbcDf.write.format("jdbc") \
    .option("url", "<jdbcUrl>/<DatabaseName>") \
    .option("dbtable", "<TableName>") \
    .option("user", "<UserName>") \
    .option("password", "<Password>").save() # Using `save()`

# Or, using `jdbc()`
jdbcDf_2.write.option("IF NEEDED") \
    .jdbc("<jdbcUrl>", "<DatabaseName>.<TableName>", properties={"user": "<UserName>", "password": "<Password>"})
```


### Query Pushdown
`.option("dbtable", "<PUSHDOWN QUERY>")`のようにqueryを含めることでDataFrameを作成する前に、dataをfilteringすることができる。ここでは以下のMySQLにおけるデータを対象に確認してみる。

```text
mysql> select * from roomdata.rawdata limit 10;
+------------+------------+------------------+--------------------+--------------------+
| recordat   | ts         | uuid             | humid              | temp               |
+------------+------------+------------------+--------------------+--------------------+
| 2018-02-21 | 1519176444 | 000000005522a6ad |            28.6395 |  23.71289000000001 |
| 2018-02-21 | 1519177268 | 000000005522a6ad | 28.139300000000002 | 23.571910000000003 |
| 2018-02-21 | 1519177854 | 000000005522a6ad |            26.2666 | 22.897220000000004 |
| 2018-02-21 | 1519174930 | 000000005522a6ad | 28.151500000000002 | 24.186180000000007 |
| 2018-02-21 | 1519177066 | 000000005522a6ad |            28.6761 | 23.481280000000005 |
| 2018-02-21 | 1519178065 | 000000005522a6ad | 26.785100000000003 | 22.897220000000004 |
| 2018-02-21 | 1519176446 | 000000005522a6ad |            28.6212 | 23.682680000000005 |
| 2018-02-21 | 1519175166 | 000000005522a6ad | 27.340200000000003 |           24.13583 |
| 2018-02-21 | 1519177297 | 000000005522a6ad |            28.7005 | 23.360440000000004 |
| 2018-02-21 | 1519175459 | 000000005522a6ad | 28.297900000000002 | 24.075410000000005 |
+------------+------------+------------------+--------------------+--------------------+

mysql> select count(*) from rawdata;
+----------+
| count(*) |
+----------+
|  7736630 |
+----------+
```

```py
pushDownQuery = """(SELECT * FROM <TABLE_NAME> WHERE temperature > 28) AS <TABLE_NAME>"""

jdbcDf = spark.read.format("jdbc") \
    .option("driver", "com.mysql.jdbc.Driver") \
    .option("url", "<jdbcUrl>/<DatabaseName>") \
    .option("dbtable", pushDownQuery) \
    .option("user", "<UserName>") \
    .option("password", "<Password>").load() # Using `load()`

# Output example
jdbcDf.show()
'''
+----------+----------+----------------+------------------+------------------+
| recordat| ts| uuid| humid| temp|
+----------+----------+----------------+------------------+------------------+
|2018-02-21|1519176444|000000005522a6ad| 28.6395| 23.71289000000001|
|2018-02-21|1519177268|000000005522a6ad|28.139300000000002|23.571910000000003|
|2018-02-21|1519174930|000000005522a6ad|28.151500000000002|24.186180000000007|
|2018-02-21|1519177066|000000005522a6ad| 28.6761|23.481280000000005|
|2018-02-21|1519176446|000000005522a6ad| 28.6212|23.682680000000005|
|2018-02-21|1519177297|000000005522a6ad| 28.7005|23.360440000000004|
|2018-02-21|1519175459|000000005522a6ad|28.297900000000002|24.075410000000005|
|2018-02-21|1519176323|000000005522a6ad| 28.8225|23.743100000000005|
...
'''

jdbcDf.explain()
'''
== Physical Plan ==
*(1) Scan JDBCRelation((SELECT * FROM rawdata WHERE humid > 28) AS rawdata) [numPartitions=1] [recordat#0,ts#1L,uuid#2,humid#3,temp#4] PushedFilters: [], ReadSchema: struct<recordat:string,ts:bigint,uuid:string,humid:double,temp:double>
End of LogType:stdout
'''

```

#### Reading from databases in parallel
ここではJDBC resourceから並列で読む、あるいは特定のデータに限定することができる以下の2点について確認する。
* `numPartitions`
* PushDownPredicate

`numPartitions` optionを利用することでJDBC resourceから並列で読み込むことができる (Defaultでは上記`jdbcDf.explain()`の出力にもある通り、1taskで読まれる)。ただしあくまでも`numPartitions`はmax値であり、読み込みデータ量が少ない場合は10並列とならないことに注意する。

```py
jdbcDf = spark.read.format("jdbc") \
    .option("driver", "com.mysql.jdbc.Driver") \
    .option("url", "<jdbcUrl>/<DatabaseName>") \
    .option("dbtable", "<TableName>") \
    .option("user", "<UserName>") \
    .option("password", "<Password>") \
    .option("numPartitions", 10).load() # Using numPartitions option
```

別のoptimizationとしてPushDownPredicateを利用することで、指定したpredicateにより特定のデータを対象とすることができる。具体的な例について以下に示す。

```py
predicates = [
    "year='2018' AND month='11'",
    "year='2019' AND month='02'"
]

jdbcDf = spark.read.format("jdbc") \
    .option("driver", "com.mysql.jdbc.Driver") \
    .option("url", "<jdbcUrl>/<DatabaseName>") \
    .option("dbtable", "<TableName>") \
    .option("user", "<UserName>") \
    .option("password", "<Password>") \
    .option("pushDownPredicate", predicates).load() # Using numPartitions option

# Or
spark.read.jdbc(url, tablename, predicates=predicates, properties=props) # props = {"driver":"xxx", ...}
```

#### Partitioning based on a sliding window
ここではpartition based predicateについて確認する。具体的には、`numPartitions`に加え、`lowBound`および`upperBound`を指定し、さらに対象の**numeric** columnを指定することで、対象のcolumnにおけるmin-maxの範囲を指定することができる。

```py
# Example
jdbcDf = spark.read.format("jdbc") \
    .option("driver", "com.mysql.jdbc.Driver") \
    .option("url", "<jdbcUrl>/<DatabaseName>") \
    .option("dbtable", "<TableName>") \
    .option("user", "<UserName>") \
    .option("password", "<Password>") \
    .option("numPartitions", 3000) \
    .option("partitionColumn", "<NumericColumn>") \
    .option("lowerBound", 0L) \
    .option("upperBound", 3000L).load()

# Or
spark.read.jdbc(url, tablename, column=col, properties=props, lowerBound=0L, upperBound=3000L, numPartitions=3000)
```

## 7. For Text Files
SparkはPlai-text fileのRead/Writeについてもサポートしている。Major formatでないファイル (Apache logなど)を指定した内容でparseしたい場合に利用する。Text fileはSparkのnative typeを利用できるという点からDatasetAPIを利用することが良い。

```py
# Read
spark.read.textFile("<PATH>") # or, spark.read.text("<PATH>")

# Write - Need to select a single column (otherwise, the write will fail)
dataframe.select("<SPECIFIC COLUMN>").write.text("<PATH>")
```

注意点としては以下
* `textFile`をRead時に使用すると、partitioned directory namesは無視される
* `text`をRead/Writeともに使用すると、Partitionも考慮される (つまり各Partitionがread/writeできるようになる)

## 8. Advanced Topics for Read/Write
ここでは並列処理のコントロールや、後にReadを高速化するためのBucketing, Partitioningに関して、どうWriteするのかなどを記載する。具体的には以下の内容を扱う。
* Reading
    * Splittable File Types and Compression Format
    * Reading Data in Parallel
* Writing
    * Writing Data in Parallel - Partitioning, Bucketing
    * Writing Complex Types
* Managing File Size

### 8-1. About Reading
#### 8-1-1. Splittable File Types and Compression Format
Sparkでは基本的にSplittable fileを使用することでより高速なperformanceを得られたり、OOMを防げたりするケースが多い。Parquet + gzipやParquet + snappyが推奨される。よく使用されるfile formatとcompressionがsplittable or notかについては以下の表にまとめている。

| File format and/or Compression | Splittable or Unsplittable?|
|:-:|:-:|
| bzip2, lz4 | Splittable |
| gzip, zip, tar | (Basically) Unsplittable |
| JSON, CSV, XML, ORC, Apache Avro, Apache Parquet (uncompressed) | Splittable |
| Parquet.snappy (row compressed) | Splittable |
| Parquet.gzip | Splittable |

#### 8-1-2. Reading Data in Parallel
複数のExecutorで同じfileを同時に読むことはできないが、別のfileは同時に読むことができる。一般的には 読むfile数 = 読み込み時のpartition数 となるので、読み込み速度を最大化したい場合は、読むfile数をベースにExecutorにおけるtask数やNode数を調整すると良い。

### 8-2. About Writing
#### 8-2-1. Writing Data in Parallel
書き込み時のfile数は、直前のpartition数により決まってくる。Defaultでは、1file/1partitionで書き込まれる。つまり、書き込み直前のpartition数を調整することで、書き込み時のfile size/数を調整することができる。例えば、`df.repartition(5).write.format("csv").save("<PATH>")`により書き込むと、5 filesが指定したPATHに書き込まれる。

##### Partitioning
Partitioningとは、指定したPATH (directory)やTableにデータを書き込む (通常は日付などで分離されている)ことである。Sparkでは特定のKeyを指定することで、保存先を分離することができる。これにより特定のPartition (PATH)を対象としてQueryを実行できるなど、Performance向上に役立つ。

```py
# Exmple
df.limit(10).write.mode("OVERWRITE").partitionBy("<COLUMN_NAME>").save("<PATH>")

'''
$ ls /output/...
COLUMN_NAME=A/
COLUMN_NAME=B/
COLUMN_NAME=C/
...
'''
```

##### Bucketing
Bucketingとは、File organization approachであり、特定のKeyをベースに同じBucketIDとしてgroupingすることである。これにより不要なShuffleなどを後々防げたり、対象のKeyをベースにReadすることでScan範囲を絞ることができ、Performance向上に役立つ。なおBucketingはSpark-managed tableのみサポートされている。

```py
# Example
df.write.format("parquet").mode("OVERWRITE").bucketBy(10, "<COLUMN_NAME>").saveAsTable("<TABLE_NAME")

```

#### 8-2-2. Writing Complex Types
CSV fileはcomplex typeをSparkではサポートしていないことなどに注意する (Parquet, ORC, avroなどを利用すると良い)。

### 8-3. Managing File Size
Sparkではfile sizeを調整することがRead/Writeの両面において重要である。例えばfileが大量かつtoo smallで書き込みを行う場合、file metadataに関連したoverheadが大きくなりPerformanceに影響が出る。またfileが大量かつtoo largeで部分的読み込みを行う際、全fileを読み込む必要があり、これもまたPerformaceに影響が出る。こういった場合のoptionとして、`maxRecordsPerFile`を書き込み時に利用することで、1 fileあたりのfile sizeを調整することができる。

```py
df.write.option("maxRecordsPerFile", FILE_NUM) # Each file will contain at most <FILE_NUM> records.
```

## Reference
1. The Spark Definitive Guide, Chapter9 Data Sources
2. [CSV Files — Databricks Documentation](https://docs.databricks.com/data/data-sources/read-csv.html)
3. [JSON Files — Databricks Documentation](https://docs.databricks.com/data/data-sources/read-json.html)
4. [Parquet Files - Spark 2.4.4 Documentation](https://spark.apache.org/docs/latest/sql-data-sources-parquet.html)
5. [ORC Files - Spark 2.4.4 Documentation](https://spark.apache.org/docs/latest/sql-data-sources-orc.html)
6. [Connecting to SQL Databases using JDBC — Databricks Documentation](https://docs.databricks.com/data/data-sources/sql-databases.html#optimize-performance-when-reading-data)
7. [JDBC To Other Databases - Spark 2.4.4 Documentation](https://spark.apache.org/docs/latest/sql-data-sources-jdbc.html
8. [spark/JDBCOptions.scala at master · apache/spark · GitHub](https://github.com/apache/spark/blob/master/sql/core/src/main/scala/org/apache/spark/sql/execution/datasources/jdbc/JDBCOptions.scala)
9. [Connection (Java Platform SE 8)](https://docs.oracle.com/javase/jp/8/docs/api/java/sql/Connection.html)