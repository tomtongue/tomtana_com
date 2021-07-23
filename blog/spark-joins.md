---
title: Join operations in Spark
description: Details about join operations in Spark
date: 2019-10-03
tag: [spark]
author: tomtan@
---

# Join operations in Spark

以下の内容については基本的に[Spark: The Definitive Guide](https://www.oreilly.com/library/view/spark-the-definitive/9781491912201/)の内容をベースとしており、一部必要な情報については他のリソースから付け足している。Sparkについて理解を深めるにはまず本書を読んでおくと良い。今回はChapter8 JoinをベースとしてDataFrame Joinおよび追加でRDD Joinについて挙動を確認していく。大まかな流れとしては以下。

1. DataFrame Join Types - Inner, Outer, Left Outer, Right Outer, Left Semi, Left Anti, Natural, Cross (Cartesian)
2. Notes in Join operation
3. How performing DataFrame Join
4. RDD Join
5. Misc

<!--truncate-->

**Join**とは2つのData-set (*Left*と*Right*)における、1つ以上の**Key**を比較し、それぞれのデータを合わせることである。よく知られるJoin expressionとしては**Equi Join**がある。これはLeft-sideおよびRight-sideにおけるKeyを比較し、等しいものを合わせ、異なるKeyを含むRowは捨てるといったものである。SparkではEqui Join以外のJoinもサポートしており、それらについては以下に記載する。

## 1. DataFrame Join Types
![](/assets/spark-joins/join_operations.png)

1. [Inner Joins](#1-1-inner-joins)
2. [Outer Joins](#1-2-outer-joins)
3. [Left Outer Joins](#1-3-left-outer-joins)
4. [Right Outer Joins](#1-4-right-outer-joins)
5. [Left Semi Joins](#1-5-left-semi-joins)
6. [Left Anti Joins](#1-6-left-anti-joins)
7. [Natural Joins](#1-7-natural-joins)
8. [Cross (or Cartesian) Joins](#1-8-cross-or-cartesian-joins)

上記8Join operationsについてそれぞれ確認するために、まずは以下の通りData-setを準備する (Definitive GuideではScala, PySparkどちらともで示されていたがここでは簡単のためPySparkのみ記載する。また元Data-setは一部変更している)。

```py
hero = spark.createDataFrame([
    (0, "Saitama", 1, [100, 50]),
    (1, "Genos", 3, [500]),
    (2, "King", 4, [100, 250, 500])
]).toDF("id", "name", "hero_rank_range", "rank_history")

heroRankRange = spark.createDataFrame([
    (0, "c", "any"),
    (1, "b", "any"),
    (2, "a", "any"),
    (3, "s", "eleven-to-fifteen"),
    (4, "s", "one-to-ten")
]).toDF("id", "class", "rank")

rankHistory = spark.createDataFrame([
    (500, "s"),
    (250, "a"),
    (100, "b"),
    (50, "c")
]).toDF("id", "rank")

# Register tables to use SparkSQL
hero.createOrReplaceTempView("hero")
heroRankRange.createOrReplaceTempView("heroRankRange")
rankHistory.createOrReplaceTempView("rankHistory") # Using handling complex type
```

Additaionlly, we confirm all tables:

```py
hero.show()
'''
+---+-------+---------------+---------------+
| id|   name|hero_rank_range|   rank_history|
+---+-------+---------------+---------------+
|  0|Saitama|              1|      [100, 50]|
|  1|  Genos|              3|          [500]|
|  2|   King|              4|[100, 250, 500]|
+---+-------+---------------+---------------+
'''

heroRankRange.show() 
'''
+---+-----+-----------------+
| id|class|             rank|
+---+-----+-----------------+
|  0|    c|              any|
|  1|    b|              any|
|  2|    a|              any|
|  3|    s|eleven-to-fifteen|
|  4|    s|       one-to-ten|
+---+-----+-----------------+
'''

rankHistory.show()
'''
+---+----+
| id|rank|
+---+----+
|500|   s|
|250|   a|
|100|   b|
| 50|   c|
+---+----+
'''
```

### 1-1. Inner Joins
Inner Joinは各Tableにおける指定されたKeyを比較し、共通しているRowのみ残し、Tableを結合する (以下の例では、`hero.hero_rank_range`と`heroRankRange.id`における共通のもののみ残っており、Right-sideのその他のRowは捨てられている)。なおDataFrameにおけるDefaultのJoinはInnerで、明示的に`inner`と指定する必要はない。

```py
# Left: hero, Right: heroRankRange
df_inner = hero.join(heroRankRange, hero.hero_rank_range == heroRankRange.id, 'inner')

# Or you can call join method as follows
df_inner = hero.join(heroRankRange, hero['hero_rank_range'] == heroRankRange['id'])

# Using SparkSQL in PySpark
inner_join_sql = "SELECT * FROM hero INNER JOIN heroRankRange ON hero.hero_rank_range = heroRankRange.id"
df_inner = spark.sql(inner_join_sql)

df_inner.show()
'''
+---+-------+---------------+---------------+---+-----+-----------------+
| id|   name|hero_rank_range|   rank_history| id|class|             rank|
+---+-------+---------------+---------------+---+-----+-----------------+
|  0|Saitama|              1|      [100, 50]|  1|    b|              any|
|  1|  Genos|              3|          [500]|  3|    s|eleven-to-fifteen|
|  2|   King|              4|[100, 250, 500]|  4|    s|       one-to-ten|
+---+-------+---------------+---------------+---+-----+-----------------+
'''
```

### 1-2. Outer Joins
指定したTableをKeyにかかわらず結合する。共通のKeyがないRowに関しては、以下の例のようにSpark DataFrameでは`null`を挿入する。


```py
# Left: hero, Right: heroRankRange
df_outer = hero.join(heroRankRange, hero.hero_rank_range == heroRankRange.id, 'outer')

# Using SparkSQL in PySpark
df_outer = spark.sql("SELECT * FROM hero FULL OUTER JOIN heroRankRange ON hero.hero_rank_range = heroRankRange.id")

df_outer.show()
'''
+----+-------+---------------+---------------+---+-----+-----------------+
|  id|   name|hero_rank_range|   rank_history| id|class|             rank|
+----+-------+---------------+---------------+---+-----+-----------------+
|null|   null|           null|           null|  0|    c|              any|
|   0|Saitama|              1|      [100, 50]|  1|    b|              any|
|   1|  Genos|              3|          [500]|  3|    s|eleven-to-fifteen|
|null|   null|           null|           null|  2|    a|              any|
|   2|   King|              4|[100, 250, 500]|  4|    s|       one-to-ten|
+----+-------+---------------+---------------+---+-----+-----------------+
'''
```

### 1-3. Left Outer Joins
**LeftにおけるTableは全て残し**、さらにLeftとRightにおいて共通している**Left側に存在する**Right-sideのKeyを合わせる。以下の例では`heroRankRange` (Left)のTableは残し、`heroRankRange.id`と`hero.hero_rank_range`において共通のKeyを残している。また**Right-side**のTableに存在しないRowについては`null`を加える。

```py
# Left: heroRankRange, Right: hero
df_left_outer = heroRankRange.join(hero, hero.hero_rank_range == heroRankRange.id, 'left_outer')

# Using SparkSQL in PySpark
df_left_outer = spark.sql("SELECT * FROM hero LEFT OUTER JOIN heroRankRange ON hero.hero_rank_range = heroRankRange.id")

df_left_outer.show()
'''
+---+-----+-----------------+----+-------+---------------+---------------+
| id|class|             rank|  id|   name|hero_rank_range|   rank_history|
+---+-----+-----------------+----+-------+---------------+---------------+
|  0|    c|              any|null|   null|           null|           null|
|  1|    b|              any|   0|Saitama|              1|      [100, 50]|
|  3|    s|eleven-to-fifteen|   1|  Genos|              3|          [500]|
|  2|    a|              any|null|   null|           null|           null|
|  4|    s|       one-to-ten|   2|   King|              4|[100, 250, 500]|
+---+-----+-----------------+----+-------+---------------+---------------+
'''
```

上記例におけるLeft/Rightを逆にJoinした場合は、Left (`hero`)側にない、Right (`heroRankRange`)側の`id`のRowは捨てられる。

```py
hero.join(heroRankRange, hero.hero_rank_range == heroRankRange.id, 'left_outer').show()

'''
+---+-------+---------------+---------------+---+-----+-----------------+
| id|   name|hero_rank_range|   rank_history| id|class|             rank|
+---+-------+---------------+---------------+---+-----+-----------------+
|  0|Saitama|              1|      [100, 50]|  1|    b|              any|
|  1|  Genos|              3|          [500]|  3|    s|eleven-to-fifteen|
|  2|   King|              4|[100, 250, 500]|  4|    s|       one-to-ten|
+---+-------+---------------+---------------+---+-----+-----------------+
'''
```

### 1-4. Right Outer Joins
[1-3. Left Outer Joins](#1-3-left-outer-joins)と類似しており、**Right-sideのTableは全て残し**、LeftとRightを比較した上で、共通している**Left側に存在する**Left-sideのKeyを合わせる。以下の例では、`heroRankRange` Tableは全て残し、Left/Rightで共通しているものをさらに結合している。**Left-side**のTableに存在しないRowについては`null`を加える。

```py
# Left: hero, Right: heroRankRange
df_right_outer = hero.join(heroRankRange, hero.hero_rank_range == heroRankRange.id, 'right_outer')

# Using SparkSQL in PySpark
df_right_outer = spark.sql("SELECT * FROM hero RIGHT OUTER JOIN heroRankRange ON hero.hero_rank_range = heroRankRange.id")

df_right_outer.show()
'''
+----+-------+---------------+---------------+---+-----+-----------------+
|  id|   name|hero_rank_range|   rank_history| id|class|             rank|
+----+-------+---------------+---------------+---+-----+-----------------+
|null|   null|           null|           null|  0|    c|              any|
|   0|Saitama|              1|      [100, 50]|  1|    b|              any|
|   1|  Genos|              3|          [500]|  3|    s|eleven-to-fifteen|
|null|   null|           null|           null|  2|    a|              any|
|   2|   King|              4|[100, 250, 500]|  4|    s|       one-to-ten|
+----+-------+---------------+---------------+---+-----+-----------------+
'''
```

### 1-5. Left Semi Joins
LeftとRightを比較のみ行われ、共通のKeyがあればそのRowを残し、共通でないものは捨てる。DataFrameのFilteringを行う際に利用すると良い (Right-sideのTableは捨てられる)。以下のように`hero`をLeftとした場合は、指定したKeyに関して、全Rowが`heroRankRange`に含まれるため全Rowが残る。

```py
# Left: hero, Right: heroRankRange
df_left_semi = hero.join(heroRankRange, hero.hero_rank_range == heroRankRange.id, 'left_semi')

# Using SparkSQL in PySpark
df_left_semi = spark.sql("SELECT * FROM hero LEFT SEMI JOIN heroRankRange ON hero.hero_rank_range = heroRankRange.id")

df_left_semi.show()
'''
+---+-------+---------------+---------------+
| id|   name|hero_rank_range|   rank_history|
+---+-------+---------------+---------------+
|  0|Saitama|              1|      [100, 50]|
|  1|  Genos|              3|          [500]|
|  2|   King|              4|[100, 250, 500]|
+---+-------+---------------+---------------+
'''
```

Left/Right逆にすると、`heroRankRange`と`hero`の両方に含まれているKeyが存在するRowのみ残り、それ以外は捨てられる。

```py
df_left_semi_opp = heroRankRange.join(hero, hero.hero_rank_range == heroRankRange.id, 'left_semi')
df_left_semi_opp.show()

'''
+---+-----+-----------------+
| id|class|             rank|
+---+-----+-----------------+
|  1|    b|              any|
|  3|    s|eleven-to-fifteen|
|  4|    s|       one-to-ten|
+---+-----+-----------------+
'''
```

### 1-6. Left Anti Joins
[1-5. Left Semi Joins](#1-5-left-semi-joins)と同様に共通のKeyがあるかを比較し、Right-sideのTableを捨てる (下の例では`hero` Tableが捨てられる)が、Left Semi Joinsとは逆で、**共通でないものを残し、共通のものを捨てる**。*Anti*についてはSQL Filterにおける`NOT IN`と考えると理解し易い。

```py
# Left: heroRankRange, Right: hero
df_left_anti = heroRankRange.join(hero, hero.hero_rank_range == heroRankRange.id, 'left_anti')

# Using SparkSQL in PySpark
df_left_anti = spark.sql("SELECT * FROM heroRankRange LEFT ANTI JOIN hero ON hero.hero_rank_range = heroRankRange.id")

df_left_anti.show()
'''
+---+-----+----+
| id|class|rank|
+---+-----+----+
|  0|    c| any|
|  2|    a| any|
+---+-----+----+
'''
```

Left/Right逆にすると、`hero.hero_rank_range`における各値は全て`heroRankRange.id`に含まれるので以下の通り空のDataFrameが返される。

```py
df_left_anti_opp = hero.join(heroRankRange, hero.hero_rank_range == heroRankRange.id, 'left_anti')
df_left_anti_opp.show()

'''
+---+----+---------------+------------+
| id|name|hero_rank_range|rank_history|
+---+----+---------------+------------+
+---+----+---------------+------------+
'''
```

### 1-7. Natural Joins
Natural Joinsの場合は暗黙的にどのKeyを結合するかSpark側で推測される。使用する場合は意図したJoinになっているか注意する必要がある。

```py
df_natural = spark.sql("SELECT * FROM hero NATURAL JOIN heroRankRange")

df_natural.show()
'''
+---+-------+---------------+---------------+-----+----+
| id|   name|hero_rank_range|   rank_history|class|rank|
+---+-------+---------------+---------------+-----+----+
|  0|Saitama|              1|      [100, 50]|    c| any|
|  1|  Genos|              3|          [500]|    b| any|
|  2|   King|              4|[100, 250, 500]|    a| any|
+---+-------+---------------+---------------+-----+----+
'''

df_natural.explain()
'''
== Physical Plan ==
*Project [id#9L, name#10, hero_rank_range#11L, rank_history#12, class#36, rank#37]
+- *SortMergeJoin [id#9L], [id#35L], Inner
   :- *Sort [id#9L ASC NULLS FIRST], false, 0
   :  +- Exchange hashpartitioning(id#9L, 200)
   :     +- *Project [_1#0L AS id#9L, _2#1 AS name#10, _3#2L AS hero_rank_range#11L, _4#3 AS rank_history#12]
   :        +- *Filter isnotnull(_1#0L)
   :           +- Scan ExistingRDD[_1#0L,_2#1,_3#2L,_4#3]
   +- *Sort [id#35L ASC NULLS FIRST], false, 0
      +- Exchange hashpartitioning(id#35L, 200)
         +- *Project [_1#28L AS id#35L, _2#29 AS class#36, _3#30 AS rank#37]
            +- *Filter isnotnull(_1#28L)
               +- Scan ExistingRDD[_1#28L,_2#29,_3#30]
'''
```

上記ように`explain()` methodを利用すると、`id`をKeyとしてInner Joinが行われていることが確認できる。参考までに例えばLeft Antiの場合のPhysical planを確認してみると、以下の通り`LeftAnti`の計画があることが確認できる。

```py
df_left_anti_opp = hero.join(heroRankRange, hero.hero_rank_range == heroRankRange.id, 'left_anti')
df_left_anti_opp.explain()

'''
== Physical Plan ==
SortMergeJoin [hero_rank_range#11L], [id#35L], LeftAnti
:- *Sort [hero_rank_range#11L ASC NULLS FIRST], false, 0
:  +- Exchange hashpartitioning(hero_rank_range#11L, 200)
:     +- *Project [_1#0L AS id#9L, _2#1 AS name#10, _3#2L AS hero_rank_range#11L, _4#3 AS rank_history#12]
:        +- Scan ExistingRDD[_1#0L,_2#1,_3#2L,_4#3]
+- *Sort [id#35L ASC NULLS FIRST], false, 0
   +- Exchange hashpartitioning(id#35L, 200)
      +- *Project [_1#28L AS id#35L]
         +- Scan ExistingRDD[_1#28L,_2#29,_3#30]
'''
```

### 1-8. Cross (or Cartesian) Joins

```py
df_cross = heroRankRange.join(hero, hero.hero_rank_range == heroRankRange.id, 'cross')

df_cross.show()
'''
+---+-----+-----------------+---+-------+---------------+---------------+
| id|class|             rank| id|   name|hero_rank_range|   rank_history|
+---+-----+-----------------+---+-------+---------------+---------------+
|  1|    b|              any|  0|Saitama|              1|      [100, 50]|
|  3|    s|eleven-to-fifteen|  1|  Genos|              3|          [500]|
|  4|    s|       one-to-ten|  2|   King|              4|[100, 250, 500]|
+---+-----+-----------------+---+-------+---------------+---------------+
'''
```

上記例のLeft/Rightを逆にした場合は、

```py
hero.join(heroRankRange, hero.hero_rank_range == heroRankRange.id, 'cross').show()

'''
+---+-------+---------------+---------------+---+-----+-----------------+
| id|   name|hero_rank_range|   rank_history| id|class|             rank|
+---+-------+---------------+---------------+---+-----+-----------------+
|  0|Saitama|              1|      [100, 50]|  1|    b|              any|
|  1|  Genos|              3|          [500]|  3|    s|eleven-to-fifteen|
|  2|   King|              4|[100, 250, 500]|  4|    s|       one-to-ten|
+---+-------+---------------+---------------+---+-----+-----------------+
'''
```

なおCartesian Joinについては以下の点を考慮する必要がある。

* Output rowの数に気を付ける (ex. 100,000 * 100,000 = 10B)
* Cartesian Joinの代替案を実施する: 
    * UniqueIdを持ったRDDを作成し、このKeyをベースにJoinする (RDDであれば細かく制御可能)
    * Broadcastを強制する
    * 各UIDごとにUDFを呼び出すUDFを作成し、Table rowに対し処理を行う
* 事前にサンプルデータセットをベースに現在のcluster sizeに対する所要時間を見積もっておく

## 2. Notes in Join Operation
ここではJoin operationを行う上で留意しなければならないことや、その扱い方について記載する。具体的には以下の内容に触れる。

* Joins on Complex Types
* Handling Duplicate Column Names - 3 approaches

### Joins on Complex Types
Complex Typesに関するJoinについても同様に実施できる。以下では、`hero` Tableにおける`id` Columnを`person_id`にRenameしてから、`rank_history` (in `hero` Table)および`id` (in `rankHistory` Table)ColumnをKeyとしてJoinしている。

```py
from pyspark.sql.functions import expr

df_rename = hero.withColumnRenamed('id', 'person_id')
df_rename_join = df_rename.join(rankHistory, expr('array_contains(rank_history, id)')) # By default, inner join

df_rename.show()
'''
+---------+-------+---------------+---------------+
|person_id|   name|hero_rank_range|   rank_history|
+---------+-------+---------------+---------------+
|        0|Saitama|              1|      [100, 50]|
|        1|  Genos|              3|          [500]|
|        2|   King|              4|[100, 250, 500]|
+---------+-------+---------------+---------------+
'''

df_rename_join.show()
'''
+---------+-------+---------------+---------------+---+----+
|person_id|   name|hero_rank_range|   rank_history| id|rank|
+---------+-------+---------------+---------------+---+----+
|        0|Saitama|              1|      [100, 50]|100|   b|
|        0|Saitama|              1|      [100, 50]| 50|   c|
|        1|  Genos|              3|          [500]|500|   s|
|        2|   King|              4|[100, 250, 500]|500|   s|
|        2|   King|              4|[100, 250, 500]|250|   a|
|        2|   King|              4|[100, 250, 500]|100|   b|
+---------+-------+---------------+---------------+---+----+
'''
```

### Handling Duplicate Column Names
Join処理後に重複したColumnに対し行う処理としては、以下の3 approachesが考えられる。

1. Different join expression
2. Dropping the column after join
3. Renaming a column before the join

DataFrame JoinではCatalyst内で各Columnに対しuniqueIdが設定される。なお本uniqueIdはCatalyst内部で使用され外部から参照することはできない。各ColumnがuniqueIdで扱われるために、Duplicated column namesをCatalyst内で扱うことができず、手動で対応する必要がある。Duplicated column namesが起きた場合以下の2 situationsの発生を考慮する必要がある。
* Join時に指定したDataFrame Keyが同じColumn nameである場合
* Join時に指定したDataFrame Keyは異なるが、各DataFrameにて同じColumn nameをもつ場合

```py
df_dup = heroRankRange.withColumnRenamed('id', 'hero_rank_range')
df_dup_join = hero.join(df_dup, hero.hero_rank_range == df_dup.hero_rank_range)
df_dup_join.show()

'''
# Output - Following table has the duplicated column name; `hero_rank_range`
+---+-------+---------------+---------------+---------------+-----+-----------------+
| id|   name|hero_rank_range|   rank_history|hero_rank_range|class|             rank|
+---+-------+---------------+---------------+---------------+-----+-----------------+
|  0|Saitama|              1|      [100, 50]|              1|    b|              any|
|  1|  Genos|              3|          [500]|              3|    s|eleven-to-fifteen|
|  2|   King|              4|[100, 250, 500]|              4|    s|       one-to-ten|
+---+-------+---------------+---------------+---------------+-----+-----------------+
'''

# Then, fetching the `hero_rank_range` column...
df_dup_join.select('hero_rank_range').show()

'''
# => Error!
u"Reference 'hero_rank_range' is ambiguous, could be: hero_rank_range#11L, hero_rank_range#97L.;"
Traceback (most recent call last):
...
    raise AnalysisException(s.split(': ', 1)[1], stackTrace)
AnalysisException: u"Reference 'hero_rank_range' is ambiguous, could be: hero_rank_range#11L, hero_rank_range#97L.;"
'''
```

Duplicated column namesには本sectionの冒頭でも記載したが以下の3 Patternsで対応すると良い。

#### (1) Different join expression
最も簡単な方法としては、Join expressionを**BooleanからString or Sequence expressionへ変更**することである。例えば以下のようにString expressionに変更した場合、Duplicated columnはRemoveされる。

```py
hero.join(df_dup, 'hero_rank_range').show()

'''
# Output - Removed hero_rank_range column
+---------------+---+-------+---------------+-----+-----------------+
|hero_rank_range| id|   name|   rank_history|class|             rank|
+---------------+---+-------+---------------+-----+-----------------+
|              1|  0|Saitama|      [100, 50]|    b|              any|
|              3|  1|  Genos|          [500]|    s|eleven-to-fifteen|
|              4|  2|   King|[100, 250, 500]|    s|       one-to-ten|
+---------------+---+-------+---------------+-----+-----------------+
'''


hero.join(df_dup, 'hero_rank_range').select('hero_rank_range').show()

'''
# Output - You can use `select`!
+---------------+
|hero_rank_range|
+---------------+
|              1|
|              3|
|              4|
+---------------+
'''
```

#### (2) Dropping the column after the join
Join後に`drop` methodによりDuplicated columnをdropすることで対応する。ただし事前に元のDataFrameを参照する必要がある。このApproachは以下の2つの場合に有効である。

1. 同じKeyに対してJoinする場合
2. Join対象のDataFrameが同じColumn nameを持つ場合

それぞれの場合について、以下に対応例を示す。

```py
# Pattern 1 - Join for same keys
hero.join(df_dup, hero.hero_rank_range == df_dup.hero_rank_range).drop(hero.hero_rank_range).select('hero_rank_range').show()

'''
## Output
+---------------+
|hero_rank_range|
+---------------+
|              1|
|              3|
|              4|
+---------------+
'''

# Pattern 2 - Source dataframes have same column names
hero.join(heroRankRange, hero.hero_rank_range == heroRankRange.id).drop(heroRankRange.id).show()

'''
## Output
+---+-------+---------------+---------------+-----+-----------------+
| id|   name|hero_rank_range|   rank_history|class|             rank|
+---+-------+---------------+---------------+-----+-----------------+
|  0|Saitama|              1|      [100, 50]|    b|              any|
|  1|  Genos|              3|          [500]|    s|eleven-to-fifteen|
|  2|   King|              4|[100, 250, 500]|    s|       one-to-ten|
+---+-------+---------------+---------------+-----+-----------------+
'''
```

#### (3) Renaming a column before the join
Join前に`withColumnRenamed` methodによりDuplicated column nameとなるColumn nameを変更し、重複を防ぐことができる。

```py
heroRankRange_rename = heroRankRange.withColumnRenamed('id', 'rank_id')
hero.join(heroRankRange_rename, hero.id == heroRankRange_rename.rank_id).show()

'''
# Output
+---+-------+---------------+---------------+-------+-----+----+
| id|   name|hero_rank_range|   rank_history|rank_id|class|rank|
+---+-------+---------------+---------------+-------+-----+----+
|  0|Saitama|              1|      [100, 50]|      0|    c| any|
|  1|  Genos|              3|          [500]|      1|    b| any|
|  2|   King|              4|[100, 250, 500]|      2|    a| any|
+---+-------+---------------+---------------+-------+-----+----+
'''
```

## 3. How performing DataFrame Join
DataFrame Joinに関しては、以下2つのStrategyがある。

1. node-to-node communication strategy -> **Shuffle (Hash) Join**
2. per node computation strategy -> **Broadcast (Hash) Join**

これらの違いについてはBig-Tabale/Small-Tableの2つを考慮した際に、Big to BigでJoinするのか、あるいはBig to SmallでJoinするのかであり (あるいはSmall to Small)、それぞれCatalyst側で判断される。ここでいう *Small* とは、Table sizeが各Workerにおけるmemoryにfitすることを意味している。DataFrame JoinについてはTable sizeによってそれぞれ以下のように分類することができる。

1. Shuffle Join = **Big to Big**
2. Broadcast Join = **Big to Small** (or Small to Small)

### Shuffle Join - Big to Big
Shuffle Joinでは、Shuffleが発生する。つまり各Nodeごとにcommunicationを行い、各Nodeにおけるデータを特定のKey (もしくはkey-set)に基づきデータをshareする。本JoinはShuffle (に伴うnetwork転送)が発生するため、転送コストが高い。特にPartition分散があまりなされていない場合は特に高い。Shuffle JoinのFlowについては、MapReduceの動きと似ておりJoin対象のDataFrame (Table)がMapされ、Join-keyよりData-setがShuffleされ、最終的にKeyに基づきReduce phaseでJoinされる。

なおShuffle JoinのPerformanceに関してBestとなる場合は、DataFrameが以下をみたす場合である。

* Join-keyをベースに均等にPartition分散されていること
* 並列処理を行うにあたり適切な数のKeyを持っていること (Keyが分散していないと並列Joinできなくなる)

Best solutionとしては、Join対象の2-DataFramesがEven-shardingとなることである。もしどうしても片Table-sizeが大きくなる場合は、`filter`などでDataFrame-sizeを小さくすることも1つの方法。

なおShuffle problemsを見つけるには、**SparkUI**を確認すると良い。注目するポイントとしては以下。

* 他のTaskに比べ処理に時間のかかっているTaskがあるか
* Speculative tasksが発生しているか
* 大量のinput/shuffle outputが存在するshardがあるか

### Broadcast Join - Big to Small
Table sizeが1 WorkerNodeのmemory size内におさまる場合に ([SizeEstimator.scala](https://github.com/apache/spark/blob/master/core/src/main/scala/org/apache/spark/util/SizeEstimator.scala)により類推される)、Broadcast Joinとなり、より効率的にJoinすることが可能となる。Broadcast Joinの場合はShuffleが発生せず、Join前後のDataFrameの関係性はNarrow Dependencyとなる。具体的には以下のようなJoin Flowとなる。

DataFrame `explain` methodにより以下のように確認することができる (以下の場合はbroadcast joinとなるように強制している)。

```py
# Broadcast Join
from pyspark.sql.functions import broadcast
hero.join(broadcast(heroRankRange), hero.hero_rank_range == heroRankRange.id).explain()

'''
# Output
== Physical Plan ==
*BroadcastHashJoin [hero_rank_range#11L], [id#35L], Inner, BuildRight
:- *Project [_1#0L AS id#9L, _2#1 AS name#10, _3#2L AS hero_rank_range#11L, _4#3 AS rank_history#12]
:  +- *Filter isnotnull(_3#2L)
:     +- Scan ExistingRDD[_1#0L,_2#1,_3#2L,_4#3]
+- BroadcastExchange HashedRelationBroadcastMode(List(input[0, bigint, true]))
   +- *Project [_1#28L AS id#35L, _2#29 AS class#36, _3#30 AS rank#37]
      +- *Filter isnotnull(_1#28L)
         +- Scan ExistingRDD[_1#28L,_2#29,_3#30]
'''
```

なお`hero`と`heroRankRange`を逆にした場合も同様にBroadcast Joinとなる。SparkSQLでも同様の強制が可能で、SQL同様`/*+ ... */`とすることでHintを渡すことができる ( `MAPJOIN`, `BROADCAST`, `BROADCASTJOIN`など)。

```py
spark.sql("SELECT /*+ BROADCAST(heroRankRange) */ * FROM hero JOIN heroRankRange ON hero.hero_rank_range = heroRankRange.id").explain()

'''
# Output - same as the above output
== Physical Plan ==
*BroadcastHashJoin [hero_rank_range#11L], [id#35L], Inner, BuildRight
:- *Project [_1#0L AS id#9L, _2#1 AS name#10, _3#2L AS hero_rank_range#11L, _4#3 AS rank_history#12]
:  +- *Filter isnotnull(_3#2L)
:     +- Scan ExistingRDD[_1#0L,_2#1,_3#2L,_4#3]
+- BroadcastExchange HashedRelationBroadcastMode(List(input[0, bigint, true]))
   +- *Project [_1#28L AS id#35L, _2#29 AS class#36, _3#30 AS rank#37]
      +- *Filter isnotnull(_1#28L)
         +- Scan ExistingRDD[_1#28L,_2#29,_3#30]
'''
```

ちなみにRDBSにおけるSQLのように`/*`の後に`+`がないHintについてはSparkSQLの場合、Hintが有効にはならずに (Errorにもならない)以下の通りDefaultのSortMergeJoinとなる。

```py
spark.sql("SELECT /* BROADCAST(heroRankRange) */ * FROM hero JOIN heroRankRange ON hero.hero_rank_range = heroRankRange.id").explain()

'''
# Output
== Physical Plan ==
*SortMergeJoin [hero_rank_range#11L], [id#35L], Inner
:- *Sort [hero_rank_range#11L ASC NULLS FIRST], false, 0
:  +- Exchange hashpartitioning(hero_rank_range#11L, 200)
:     +- *Project [_1#0L AS id#9L, _2#1 AS name#10, _3#2L AS hero_rank_range#11L, _4#3 AS rank_history#12]
:        +- *Filter isnotnull(_3#2L)
:           +- Scan ExistingRDD[_1#0L,_2#1,_3#2L,_4#3]
+- *Sort [id#35L ASC NULLS FIRST], false, 0
   +- Exchange hashpartitioning(id#35L, 200)
      +- *Project [_1#28L AS id#35L, _2#29 AS class#36, _3#30 AS rank#37]
         +- *Filter isnotnull(_1#28L)
            +- Scan ExistingRDD[_1#28L,_2#29,_3#30]
'''
```

なおSparkSQLにおけるHintは必ずしも強制ではないため、Optimizer側で無視される可能性があることに注意する。

## 4. RDD Join - `join(<otherRDD>, numPartitions)`
RDD Joinについては2つのPairRDD (ex: `RDD[(K, V)]` and `RDD[(K, W)]`)を取り1つのPairRDD (ex: `RDD[(K, (V, W))]`)を返すOperationである。`join` methodを使用した場合は**Inner Join**となり、それ以外のoperationについては以下に記載するように、各Join operationごとのmethodを使用する必要がある。

* Inner Join - `join`
* FullOuter Join - `fullOuterJoin`
* LeftOuter Join - `leftOuterJoin`
* RightOuter Join - `rightOuterJoin`
* Cartesian Join - `cartesian`

例としてInner Joinを確認してみると以下の通り (今回は簡単のためDataFrameからRDDに変更しJoin operationを実施している)。

```py
# Create RDDs
rdd_hero = hero.rdd
rdd_heroRankRange = heroRankRange.rdd

# Inner Join
rdd_inner = rdd_hero.join(rdd_heroRankRange)

# Collect
rdd_inner.collect() # Output => [(0, (u'Saitama', u'c')), (1, (u'Genos', u'b')), (2, (u'King', u'a'))]

# Explain
rdd_inner.toDF().explain()

# Output - no optimization
# == Physical Plan ==
# Scan ExistingRDD[_1#96L,_2#97]
```

RDD Join operationの詳細については下図に示す通り以下のフローで実行される。

1. 2 PairRDDsに対し、`cogroup()` methodが呼ばれ、`RDD [(K, (Iterable[V1], Iterable[V2]))]` typeをもつ`MappedValuesRDD`が作成される
2. その後2つの`Iterable`間での**Cartesian product (直積)**が取られる
3. 最後に`flatMap` methodが呼ばれ、`FlatMappedValuesRDD`が作成される

詳細については[Transformation and Action in Spark Internals - join(otherRDD, numPartitions)](https://v2.tomtongue.com/blog/sparkinternals-1-3#joinotherrdd-numpartitions)に記載している。

また`join` method以外にもPairRDDをJoinするmethodの1つとして`zip`が存在する (本methodを使用する場合は、各Partitionに同数の要素がなければいけないという制約がある。失敗すると`org.apache.spark.SparkException: Can only zip RDDs with same number of elements in each partition`のエラーが出力される)。


## Misc.
その他、Joinに関して特別なUse-caseを考える。

### Theta Join
以下のようなEqualでない場合のJoinのことを指している。このようなJoinにおいてSparkSQLはtheta conditionが満たされているかどうか、各keyBに対し、各keyAを調べ、ループして確認する挙動となる。そのためkeyAおよびkeyBに対しBucketingしておくと良い。

```py
spark.sql("SELECT * FROM tableA JOIN tableB ON (keyA < keyB + 10)")
```

### One to Many Join
Single row tableが、many row tableにJoinされる場合のJoinのことを指している。この場合parquetを使用していると、重複したデータをencodeするのみでよくなるため良い。

## Reference
1. The Spark Definitive Guide, Chapter8 Joins
2. [SparkInternals/2-JobLogicalPlan.md at master · JerryLead/SparkInternals · GitHub](https://github.com/JerryLead/SparkInternals/blob/master/markdown/english/2-JobLogicalPlan.md)
3. [Optimizing Apache Spark SQL Joins: Spark Summit East talk by Vida Ha - YouTube](https://www.youtube.com/watch?v=fp53QhSfQcI)