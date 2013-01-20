# Currently Supported SQL grammar

```
id	    =>	([a-zA-Z_]+)

column      =>	id|'*'
column_list =>	(column(,column)*)
table	    =>	id

string	    =>	('.*')
number	    =>	([0-9]+(\.[0-9]+)?)

operator    =>	'=' | '!=' | '>' | '<'
logic_op    =>	'and'

clause	    =>	id operator (literal|id)
where	    =>	'where' clause (logic_op clause)*

select	    =>	'select' column_list 'from' table where? ';'
explain     =>	'explain' select
```
