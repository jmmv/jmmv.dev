#![deny(warnings)]

use crate::*;

/// Builder pattern for tests that validate `sum_all`.
#[must_use]
struct SumAllTest {
    expected: i32,
    values: Vec<i32>,
}

impl SumAllTest {
    /// Creates the test scenario and initializes it with the result we expect.
    fn expect(value: i32) -> Self {
        Self { expected: value, values: vec!() }
    }

    /// Registers a value to pass to `sum_all` as an input.
    fn add_value(mut self, value: i32) -> Self {
        self.values.push(value);
        self
    }

    /// Runs `sum_all` with all recorded values and checks the result.
    fn run(self) {
        let actual = sum_all(&self.values);
        assert_eq!(self.expected, actual);
    }
}

#[test]
fn test_sum_all_with_no_values() {
    SumAllTest::expect(0).run();
}

#[test]
fn test_sum_all_with_one_value() {
    SumAllTest::expect(5).add_value(5).run();
}

#[test]
fn test_sum_all_with_many_values() {
    SumAllTest::expect(8).add_value(3).add_value(4).add_value(1).run();
}
