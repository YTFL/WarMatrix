import unittest
from ..generators.urban import UrbanEnvironmentGenerator

class TestUrbanGeneration(unittest.TestCase):
    def test_seed_determinism(self):
        seed = 847293
        generator1 = UrbanEnvironmentGenerator(seed=seed, size="Medium")
        generator2 = UrbanEnvironmentGenerator(seed=seed, size="Medium")

        map1 = generator1.generate()
        map2 = generator2.generate()

        self.assertEqual(map1.seed, map2.seed)
        self.assertEqual(map1.size, map2.size)
        self.assertEqual(map1.grid_size, map2.grid_size)
        self.assertEqual(map1.city_bounds, map2.city_bounds)
        
        # Verify exact road match
        self.assertEqual(len(map1.roads), len(map2.roads))
        for r1, r2 in zip(map1.roads, map2.roads):
            self.assertEqual(r1.id, r2.id)
            self.assertEqual(r1.type, r2.type)
            self.assertEqual(r1.start, r2.start)
            self.assertEqual(r1.end, r2.end)
            self.assertEqual(r1.connected_roads, r2.connected_roads)

        # Verify exact district match
        self.assertEqual(len(map1.districts), len(map2.districts))
        for d1, d2 in zip(map1.districts, map2.districts):
            self.assertEqual(d1.id, d2.id)
            self.assertEqual(d1.type, d2.type)
            self.assertEqual(d1.bounds, d2.bounds)
            self.assertEqual(d1.density, d2.density)

        # Verify exact building match
        self.assertEqual(len(map1.buildings), len(map2.buildings))
        for b1, b2 in zip(map1.buildings, map2.buildings):
            self.assertEqual(b1.id, b2.id)
            self.assertEqual(b1.type, b2.type)
            self.assertEqual(b1.x, b2.x)
            self.assertEqual(b1.y, b2.y)
            self.assertEqual(b1.height, b2.height)
            self.assertEqual(b1.cover_value, b2.cover_value)
            self.assertEqual(b1.asset_key, b2.asset_key)
            self.assertEqual(b1.rotation, b2.rotation)

        # Verify exact infrastructure match
        self.assertEqual(len(map1.infrastructure), len(map2.infrastructure))
        for i1, i2 in zip(map1.infrastructure, map2.infrastructure):
            self.assertEqual(i1.id, i2.id)
            self.assertEqual(i1.type, i2.type)
            self.assertEqual(i1.x, i2.x)
            self.assertEqual(i1.y, i2.y)
            self.assertEqual(i1.strategic_value, i2.strategic_value)
            self.assertEqual(i1.asset_key, i2.asset_key)
            self.assertEqual(i1.rotation, i2.rotation)

    def test_city_bounds_containment(self):
        seed = 42
        generator = UrbanEnvironmentGenerator(seed=seed, size="Small")
        result = generator.generate()

        bounds = result.city_bounds
        
        # Verify buildings are inside city boundaries
        for b in result.buildings:
            self.assertTrue(bounds["min_x"] <= b.x <= bounds["max_x"])
            self.assertTrue(bounds["min_y"] <= b.y <= bounds["max_y"])

        # Verify infrastructure is inside city boundaries
        for i in result.infrastructure:
            self.assertTrue(bounds["min_x"] <= i.x <= bounds["max_x"])
            self.assertTrue(bounds["min_y"] <= i.y <= bounds["max_y"])

    def test_no_overlaps(self):
        seed = 9999
        generator = UrbanEnvironmentGenerator(seed=seed, size="Large")
        result = generator.generate()

        occupied = set()
        for b in result.buildings:
            cell = (b.x, b.y)
            self.assertNotIn(cell, occupied, f"Overlap detected at {cell} with building {b.id}")
            occupied.add(cell)

        for i in result.infrastructure:
            cell = (i.x, i.y)
            self.assertNotIn(cell, occupied, f"Overlap detected at {cell} with infrastructure {i.id}")
            occupied.add(cell)

    def test_cell_metadata(self):
        seed = 101010
        generator = UrbanEnvironmentGenerator(seed=seed, size="Medium")
        result = generator.generate()

        width, height = result.grid_size
        self.assertEqual(len(result.metadata), width * height)

        # Index by (x, y)
        grid = {(m.x, m.y): m for m in result.metadata}

        # Verify coordinates match
        for y in range(height):
            for x in range(width):
                self.assertIn((x, y), grid)
                cell = grid[(x, y)]
                self.assertEqual(cell.x, x)
                self.assertEqual(cell.y, y)
                
                # Check consistency of properties
                if cell.is_road:
                    self.assertEqual(cell.cover_value, 0.0)

if __name__ == '__main__':
    unittest.main()
