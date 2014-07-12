Thaumcraft 4.1 Research Helper
==========

[Link](https://github.com/danielstory/tcresearch)

This script helps you with your Thaumcraft 4.1 research. If you have a research note with two 
aspects that you don't know how to connect, simply enter them in the boxes above (*From:* and 
*To:*). Additionally, choose the minimum number of steps between those two aspects. If in your 
research note, the two aspects have two blank spaces between them, choose the value 2 for *Min. 
Steps*. As each line is completed, additional lines will become available to extend the path. 
The script will search for the shortest path (with at least the specified minimum length) that 
connects the two aspects. Note that sometimes the shortest possible path is longer than the 
given minimum.

If you are unhappy with the path you got, because you do not have access to those aspects yet 
or they are quite rare, simply disable those aspects by clicking on them in the *Available 
Aspects* or the result path. The script will then try to find alternative paths. (Note that this 
may cause the path to grow longer.) If no path can be found without using disabled aspects, the 
script will try to find the shortest path using the fewest disabled aspects.

This work is based on [ythri's](https://github.com/ythri/tcresearch/) original code with 
[Vesicavinco's](https://github.com/Vesicavinco/tcresearch) modifications, and like the originals, 
is licensed under a [Creative Commons Attribution 4.0 License](http://creativecommons.org/licenses/by/4.0/). 
Sources can be found in the [GitHub repository](https://github.com/danielstory/tcresearch).