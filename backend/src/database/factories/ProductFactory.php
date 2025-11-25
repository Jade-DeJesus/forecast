<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->word() . ' ' . $this->faker->numberBetween(100,999),
            'inventory' => $this->faker->numberBetween(0, 500),
            'avg_sales' => $this->faker->numberBetween(1, 100),
            'lead_time' => $this->faker->numberBetween(1, 30),
        ];
    }
}
