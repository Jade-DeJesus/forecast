<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = (int)$request->query('per_page', 200);
        $products = Product::select(['id','name','inventory','avg_sales','lead_time'])
            ->orderBy('id')
            ->paginate($perPage);

        return response()->json($products->items());
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'product_name' => 'required|string',
            'inventory_level' => 'nullable|numeric',
            'average_sales' => 'required|numeric',
            'days_to_replenish' => 'required|integer'
        ]);

        $created = Product::create([
            'name' => $data['product_name'],
            'inventory' => (int) ($data['inventory_level'] ?? 0),
            'avg_sales' => (int) $data['average_sales'],
            'lead_time' => (int) $data['days_to_replenish']
        ]);

        return response()->json($created, 201);

    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        return Product::findOrFail($id);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'product_name' => 'nullable|string',
            'inventory_level' => 'nullable|numeric',
            'average_sales' => 'nullable|numeric',
            'days_to_replenish' => 'nullable|integer'
        ]);

        $product = Product::findOrFail($id);
        $product->fill([
            'name' => $data['product_name'] ?? $product->name,
            'inventory' => isset($data['inventory_level']) ? (int)$data['inventory_level'] : $product->inventory,
            'avg_sales' => isset($data['average_sales']) ? (int)$data['average_sales'] : $product->avg_sales,
            'lead_time' => isset($data['days_to_replenish']) ? (int)$data['days_to_replenish'] : $product->lead_time,
        ]);
        $product->save();

        return response()->json($product);

    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        Product::destroy($id);
        return response()->json(null, 204);
    }
}
