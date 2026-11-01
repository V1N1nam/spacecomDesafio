# Detecção de Encontros | Desafio Trainee Tech Spacecom 2027

Solução em JavaScript (Node.js) para detectar encontros físicos entre pessoas monitoradas por tornozeleira e vítimas com medida protetiva, a partir de arquivos de geolocalização.

## Como executar

Requisito: Node.js 18 ou superior (desenvolvido e testado no Node 24). Não há dependências externas, então não é preciso rodar `npm install`.

1. Coloque os arquivos `dataset1.txt` a `dataset7.txt` em `data/input/`.
2. Na raiz do projeto, rode:

```bash
npm start
```

Os resultados são gravados em `output/resultado1.json` a `output/resultado7.json`, e o terminal mostra a quantidade de linhas, de encontros e o tempo de execução de cada dataset.

Para conferir os resultados:

```bash
npm run validate
```

## Estrutura

```
src/
  index.js        ponto de entrada: processa os 7 datasets e mede o tempo
  parser.js       leitura do arquivo em streaming, agrupando por timestamp
  haversine.js    distância entre dois pontos (raio da Terra 6.371.000 m)
  detector.js     encontra os pares a menos de 20 m dentro de cada timestamp
  classifier.js   define o tipo do encontro (protetiva, faccao, generico)
scripts/
  validate.js     compara o output com uma referência (acertos, faltantes, falsos positivos)
  inspect.js      diagnóstico dos dados (duplicados, linhas inválidas, ordenação)
  debug.js        script usado para investigar um caso específico de erro
data/
  input/          datasets
  expected/       gabaritos oficiais (respostas1 e respostas2)
  referencia/     saída da versão força bruta, usada como referência
output/           resultados gerados
visualizacao/     mapa interativo dos encontros (extra, não faz parte do algoritmo)
```

## Lógica

### 1. Leitura em streaming

O dataset7 tem 12 milhões de linhas e não cabe numa única string no Node (o limite é de aproximadamente 512 MB). Por isso o arquivo é lido linha a linha.

Antes de decidir isso, rodei o `inspect.js` nos datasets 1 a 6 e confirmei que todos vêm ordenados por timestamp, sem linhas duplicadas e sem valores inválidos. Com o arquivo ordenado, dá para juntar as pessoas do timestamp atual e, quando o timestamp muda, processar aquele grupo e descartá-lo. A memória guarda só um timestamp por vez, independente do tamanho do arquivo.

Como não foi possível verificar a ordenação do dataset7 da mesma forma, o parser lança um erro se encontrar um timestamp fora de ordem. Assim, se essa premissa um dia falhar, o programa avisa em vez de gerar um resultado errado em silêncio.

### 2. Detecção dentro de cada timestamp

A versão inicial comparava todos os pares do grupo (força bruta). Ela é correta, mas com 120 pessoas por timestamp são 7.140 pares, e no dataset6 isso dá quase 500 milhões de cálculos de Haversine.

A versão final ordena as pessoas do grupo por latitude e, para cada pessoa, compara só com as seguintes até a diferença de latitude passar de 20 metros. Nesse ponto o loop para, porque todas as pessoas seguintes estão ainda mais ao norte.

Isso funciona porque a distância real entre dois pontos nunca é menor que a distância só no eixo norte-sul, e um grau de latitude tem o mesmo tamanho em qualquer lugar do globo. Então, se a diferença de latitude já passa de 20 m, o par com certeza não é um encontro. O limite em graus tem uma folga de 0,1%: no pior caso isso gera um cálculo de Haversine a mais, mas nunca faz perder um encontro.

O Haversine só é calculado para os pares que passam por esse filtro, e o encontro só é registrado se a distância for estritamente menor que 20 m.

### 3. Classificação

A ordem das verificações é a própria regra de negócio, do caso mais específico para o mais genérico:

1. Se uma das pessoas tem medida protetiva e a outra está na sua lista de agressores: `protetiva`. A verificação é feita nos dois sentidos, porque a vítima pode chegar em qualquer posição do par.
2. Se uma das pessoas é vítima, mas a outra não é agressor dela: não é encontro.
3. Se os dois são monitorados da mesma facção: `faccao`. Monitorados sem facção não são considerados da mesma facção.
4. Qualquer outro par de monitorados: `generico`.

Cada par é registrado uma única vez por timestamp, porque o loop compara cada pessoa apenas com as que vêm depois dela na lista.

## Por que esta abordagem

- **Correção primeiro.** A pontuação é acertos menos falsos positivos, então comecei pela força bruta, que é simples e não tem como pular um par, e só otimizei depois de bater 100% nos gabaritos.
- **Otimizei onde estava o tempo.** Medi separadamente o tempo de leitura e o de comparação antes de mudar o algoritmo. A comparação era cerca de 2/3 do total, então foi ali que mexi.
- **Ordenação em vez de grade espacial.** Considerei dividir o mapa em células de 20 m, mas com grupos de 20 a 120 pessoas, montar uma estrutura de células a cada timestamp custaria mais do que economizaria. A ordenação por latitude dá a mesma garantia com menos código.
- **Sem dependências e em JavaScript puro.** É um script de processamento de dados pequeno; TypeScript e bibliotecas externas acrescentariam configuração sem ganho real.

## Validação

Os datasets 1 e 2 têm gabarito oficial, e a versão força bruta acertou 100% nos dois, sem falsos positivos.

Para os datasets 3 a 7, que não têm gabarito, usei a saída da força bruta como referência. Ela compara todos os pares, então serve para provar que a versão otimizada não perdeu nenhum encontro. O `validate.js` compara as duas saídas por timestamp, par de ids (independente da ordem) e tipo.

Isso pegou um bug real. Na primeira execução da versão otimizada, faltaram encontros `protetiva` em todos os datasets. Com o `debug.js`, vi que a ordenação mudava qual pessoa do par chegava primeiro no classificador, e a verificação para o caso em que a vítima vinha em segundo estava errada. Na força bruta isso nunca aparecia, porque nos arquivos a vítima sempre vem antes do agressor. Corrigido o classificador, as duas versões passaram a dar resultados idênticos nos 7 datasets.

## Resultados

| Dataset | Linhas | Encontros | Força bruta | Versão final |
|---|---:|---:|---:|---:|
| 1 | 5.000 | 4 | 11 ms | 14 ms |
| 2 | 25.000 | 6 | 45 ms | 35 ms |
| 3 | 100.000 | 10 | 210 ms | 116 ms |
| 4 | 400.020 | 15 | 958 ms | 444 ms |
| 5 | 1.000.000 | 21 | 2,8 s | 1,1 s |
| 6 | 8.000.000 | 27 | 25,2 s | 8,6 s |
| 7 | 12.000.000 | 35 | 40,6 s | 12,9 s |

Tempos medidos na minha máquina e podem variar em outro ambiente.

## Próximo passo possível

Depois da otimização, o tempo de detecção ficou praticamente zero e quase todo o tempo restante é leitura e quebra das linhas do arquivo. O próximo ganho viria de substituir o `readline` por uma leitura manual em blocos maiores, tratando as linhas que ficam cortadas entre um bloco e outro.

## Extra: visualização no mapa

A pasta `visualizacao/` tem uma página que mostra os encontros detectados num mapa, com cor por tipo, contagem, e uma lista lateral que leva até cada encontro com o popup de ids, horário e distância.

Ela é separada do algoritmo e não é necessária para gerar os resultados. Usa o Leaflet carregado por CDN, então também não precisa instalar nada.

Para abrir, rode na raiz do projeto (depois de gerar os outputs):

```bash
npx serve .
```

e acesse `http://localhost:3000/visualizacao/`. O servidor é necessário porque o navegador bloqueia a leitura de arquivos locais pela página.

Alguns encontros aparecem no oceano. Isso acontece porque os dados do desafio são fictícios, e as coordenadas parecem ter sido geradas dentro de uma área retangular sobre a América do Sul que inclui parte do mar.

## Uso de IA

Usei IA (Claude) como apoio durante todo o desenvolvimento, e boa parte do código veio de sugestões dela. Mas não copiei e colei: fui digitando cada arquivo enquanto entendia o que cada parte fazia, e questionava o motivo das escolhas, como por que comparar o timestamp como texto, por que testar os dois lados no classificador e por que ordenar em vez de usar uma grade.

Como o problema envolve segurança pública e a pontuação penaliza falsos positivos, eu sabia desde o início que precisava validar os resultados e investigar qualquer divergência. A IA me ajudou a transformar isso em ferramentas concretas: o `validate.js`, o uso da força bruta como referência e o `debug.js` que encontrou o bug do classificador. Também foi útil para apontar erros de digitação meus, como um `lenght` que não dava erro e só fazia o loop nunca rodar.

As decisões de medir antes de otimizar, de manter uma versão correta como referência e de priorizar zero falsos positivos sobre velocidade são as que eu consigo defender em detalhe.