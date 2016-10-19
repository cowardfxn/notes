已设置使用`$`标明LATEX语句

##四种标记方式
1. `upper lines... $$\cos(x) = \frac{e^{it} + e^{-it}}{2}$$ blahblahblah...`  居中，换行  
upper lines... $$\cos(x) = \frac{e^{it} + e^{-it}}{2}$$ blahblahblah...


2. `upper lines... \\[\cos(x) = \frac{e^{it} + e^{-it}}{2}\\] blahblahblah...` 居中，换行  
upper lines... \\[\cos(x) = \frac{e^{it} + e^{-it}}{2}\\] blahblahblah...

3. `upper lines... \\(\cos(x) = \frac{e^{it} + e^{-it}}{2}\\) blahblahblah...` 不换行  
upper lines... \\(\cos(x) = \frac{e^{it} + e^{-it}}{2}\\) blahblahblah...


4. `upper lines... $\cos(x) = \frac{e^{it} + e^{-it}}{2}$ blahblahblah...` 不换行  
upper lines... $\cos(x) = \frac{e^{it} + e^{-it}}{2}$ blahblahblah...

MacDown provides various tools that add additional processing to the rendered HTML, including:

 - TeX-like math syntax, including `$$...$$`, `\\[...\\]`, `\\(...\\)`, and (optionally) `$...$` blocks.


#mathjax设置
The default math delimiters are `$$...$$` and `\[...\]` for **displayed mathematics**, and `\(...\)` for **in-line mathematics**. Note in particular that the `$...$` in-line delimiters are not used by default. That is because dollar signs appear too often in non-mathematical settings, which could cause some text to be treated as mathematics unexpectedly.  
For example, with single-dollar delimiters, "... the cost is \$2.50 for the first one, and \$2.00 for each additional one ..." would cause the phrase "*2.50 for the first one, and*" to be treated as mathematics since it falls between dollar signs. 

#Texlive
路径：
`/usr/local/texlive/2016basic/tlpkg`
