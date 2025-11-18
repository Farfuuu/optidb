import time
import random

# - FUNCIONES DE ORDENAMIENTO -

def bubble_sort(lista):
    n = len(lista)
    for i in range(n):
        for j in range(0, n - i - 1):
            if lista[j] > lista[j + 1]:
                lista[j], lista[j + 1] = lista[j + 1], lista[j]
    return lista


def quick_sort(lista):
    if len(lista) <= 1:
        return lista
    pivote = lista[len(lista) // 2]
    izquierda = [x for x in lista if x < pivote]
    centro = [x for x in lista if x == pivote]
    derecha = [x for x in lista if x > pivote]
    return quick_sort(izquierda) + centro + quick_sort(derecha)


def selection_sort(lista):
    for i in range(len(lista)):
        min_idx = i
        for j in range(i + 1, len(lista)):
            if lista[j] < lista[min_idx]:
                min_idx = j
        lista[i], lista[min_idx] = lista[min_idx], lista[i]
    return lista


def insertion_sort(lista):
    for i in range(1, len(lista)):
        clave = lista[i]
        j = i - 1
        while j >= 0 and lista[j] > clave:
            lista[j + 1] = lista[j]
            j -= 1
        lista[j + 1] = clave
    return lista


def merge_sort(lista):
    if len(lista) > 1:
        mitad = len(lista) // 2
        izquierda = lista[:mitad]
        derecha = lista[mitad:]

        merge_sort(izquierda)
        merge_sort(derecha)

        i = j = k = 0
        while i < len(izquierda) and j < len(derecha):
            if izquierda[i] < derecha[j]:
                lista[k] = izquierda[i]
                i += 1
            else:
                lista[k] = derecha[j]
                j += 1
            k += 1

        while i < len(izquierda):
            lista[k] = izquierda[i]
            i += 1
            k += 1

        while j < len(derecha):
            lista[k] = derecha[j]
            j += 1
            k += 1
    return lista


# - FUNCIONES DE BÚSQUEDA -

def linear_search(lista, valor):
    for i in range(len(lista)):
        if lista[i] == valor:
            return i
    return -1


def binary_search(lista, valor):
    inicio = 0
    fin = len(lista) - 1
    while inicio <= fin:
        medio = (inicio + fin) // 2
        if lista[medio] == valor:
            return medio
        elif lista[medio] < valor:
            inicio = medio + 1
        else:
            fin = medio - 1
    return -1


# - PRUEBAS DE ORDENAMIENTO -

listas_prueba = [
    [47, 12, 89, 5, 73, 64, 31, 96, 18, 50, 7, 92, 38, 21, 60, 3, 84, 15, 67, 42],
    ['q', 'M', 'a', 'Z', 't', 'B', 'x', 'L', 'p', 'C', 'r', 'Y', 'd', 'H', 'u', 'E', 'n', 'J', 's', 'V']
]
lista_200 = random.sample(range(1, 1000), 200)

algoritmos = {
    "Bubble Sort": bubble_sort,
    "Quick Sort": quick_sort,
    "Selection Sort": selection_sort,
    "Insertion Sort": insertion_sort,
    "Merge Sort": merge_sort
}

for nombre, funcion in algoritmos.items():
    print(f"\n--- {nombre} ---")
    for lista in listas_prueba + [lista_200]:
        copia = lista.copy()
        inicio = time.time()
        resultado = funcion(copia)
        fin = time.time()
        print(f"{nombre} -> Tiempo: {fin - inicio:.6f} segundos")


# - PRUEBAS DE BÚSQUEDA -

palabras = ['nube', 'río', 'planeta', 'música', 'sombra', 'océano', 'bosque', 'llama',
            'espejo', 'tormenta', 'sueño', 'montaña', 'susurro', 'piedra', 'luz',
            'eco', 'jardín', 'camino', 'tiempo', 'chispa']

valores_buscar = ['nube', 'carro', 'piedra', 'tierra']

print("\n--- BÚSQUEDA LINEAL ---")
for valor in valores_buscar:
    inicio = time.time()
    pos = linear_search(palabras, valor)
    fin = time.time()
    print(f"Buscar '{valor}': posición {pos} (tiempo {fin - inicio:.6f}s)")

print("\n--- BÚSQUEDA BINARIA ---")
palabras_ordenadas = sorted(palabras)
for valor in valores_buscar:
    inicio = time.time()
    pos = binary_search(palabras_ordenadas, valor)
    fin = time.time()
    print(f"Buscar '{valor}': posición {pos} (tiempo {fin - inicio:.6f}s)")
