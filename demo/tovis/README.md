# TOVISファイル仕様

## TOVISファイルの目的
- 人間にも読みやすいバイリンガルファイル（XLIFF）ファイルの構築
- セグメントに類似文の参照情報を持たせる
    - どのセグメントと似ているのか（先出＞後出）
    - 何％似ているのか
    - 編集方法（簡易オペコード）
- 原文と訳文を「行単位」で分けることで、翻訳とgitとの親和性向上

## TOVISファイルの構成
TOVISファイルはすべての情報を行単位で扱う。改行があった場合は別の種類の情報として認識される。

情報は大きく分けて、#で始まるメタ情報と、特定の記号とインデックス番号を含む本文情報の2つがある。

### メタ情報

メタ情報はロケールやファイル情報といった、プロジェクト単位の情報を記述する。

記述方法は「#+文字列+:」でキーを、その後ろに値を持つキーバリュー形式の行で、値の前後のスペースは無視される。キーと値の間のスペースは必須ではないが、可読性の観点から入力を推奨。標準のDump()ではスペースが追記される。

以下に定めるもの以外はすべて自由記述の「Remarks」として扱われる

| キー           | 値の型               | 説明                                                         |
| -------------- | -------------------- | ------------------------------------------------------------ |
| #SourceLang    | string               | 原文の言語を記述する。記述方法は標準的なロケール記法（ja-JPなど）を想定しているが、TMやMTとの連携を想定しないのであれば自由。 |
| #TargetLang    | string               | 訳出言語を記述する。記述方法の詳細は原文と同様。             |
| #IncludedFiles | string[]             | TOVISファイルに含まれている原文ファイル名を記述する。カンマ区切りで複数記述可。[]は不要。 |
| #Groups        | number[]             | WordのパラグラフやPPTのシートなど、まとめて取り扱うべき部分の切れ目を示す。ある特定のインデックスから、次に出現するインデックスまでがひとまとまりになる。<br />ここで指定したグループの原文をまとめてMTエンジンへの入力とする。 |
| #Tags          | string[]             | ファイルにタグをつける。プロジェクトの検索に。               |
| #Remarks       | string[]             | 上記以外のすべて。セミコロン区切りの配列として記述される。   |

なお、メタ情報はファイルの先頭に記述するのを標準としている。本文情報に混ぜて記述することもできるが、非推奨。なお、#Remarks以外は複数回記述されるとパースエラーとなる。

### 本文情報

本文情報は原文、訳文、訳文候補（TM、MT、修正前訳など）、用語、類似情報、コメントの6つの要素から構成される。

各要素は **要素記号:インデックス}** というキーを、その後ろに値を持つキーバリュー形式の行で、値の前後のスペースは無視される。キーと値の間のスペースは必須ではないが、可読性の観点から入力を推奨。標準のDumpではスペースが追記される。

訳文候補は更に **[]** で候補の出処を記述できる（TM、MTなど）。

原文、訳文、類似情報はインデックス番号と一対一であることが必須。訳文候補とコメントは同一インデックスでも複数回記述が可能。

| キー | 値の型 | 説明                                                         |
| ---- | ------ | ------------------------------------------------------------ |
| @:i} | string | 原文を記述する。                                             |
| λ:i} | string | （現時点で）確定された訳文を記述する。                       |
| _:i} | string[] | 翻訳の参考として使用できる訳文を記述する。<br />キーの直後に **[TM]** など訳文の出処を記述できる。<br />同じインデックス番号、同じ出処で複数回出現してもよい。 |
| $:}  | 後述   | 使用すべき用語を記述する。QAなどで使用する。 |
| ^:}  | 後述   | 類似情報を列挙する。各情報はセミコロンで分けられる。<br />詳細は表外にて。 |
| !:}  | string | コメントを自由記述できる。同じインデックス番号で複数回出現してもよい。 |

#### 用語の記述方法

以下の構成を1つの塊とする。

_原文用語::訳文用語1|訳文用語2...;_

原文の用語に対して訳文用語は一つとは限らないので、訳文用語は **|** で区切る配列の形をとる。

#### 類似情報の記述方法

以下の構成を1つの塊とする。

_先出インデックス>後出インデックス|一致百分率|処理記号,先出の処理開始位置,先出の処理文字数,後出の処理開始位置,後出の処理文字数|......;_

処理文字はOpcodeの **Replace、Insert、Delete** をそれぞれ **~、+、-** に置き換えて使用する。Equalは **=** を使用できるが、原則として省略する。

例えば、インデックス1に「これは原文です。」、インデックス3に「これは訳文ですね。」というセグメントがあった場合、インデックス1と3の類似情報の行は、それぞれ次のように記述される。

%:1} 1>3|82|~,3,4,3,4|+,7,7,7,8;

%:3} 1>3|82|~,3,4,3,4|+,7,7,7,8;

先出、後出どちらからも類似している文がわかるよう、両方に同じ情報を記述する。

情報はセミコロンで区切りながら複数列挙できる。順序は特に規定しない。

### 本文情報とインデックス番号

TOVISファイルの本文情報は、必ずしもインデックス番号どおりに並んでいる必要はないが、**人間にとっての可読性向上** が主たる目的であることから、基本的には昇順で並べることを推奨。

インデックス番号は1,3,6,7のように跳んでいても可。原文の結合などで原文が空になっても問題ない。

ただし、類似情報の参照はインデックス番号をもとに行っているため、参照外れには注意。

## その他の情報

上に挙げたキーで始まらない行はすべて無視される。

標準のDump()ではメタ情報と本文情報の間に区切り（-----）を入れているが、パース時にオブジェクトには格納されない。

そのため、TOVISファイルに書き込むこと自体はできるが、パース＞ダンプ処理を経ると、その他の情報はすべて削除されるので注意。