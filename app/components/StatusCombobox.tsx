'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

type StatusOption = {
	value: string;
	label: string;
};

type StatusComboboxProps = {
	value: string;
	onValueChange: (value: string) => void;
	options: StatusOption[];
	placeholder?: string;
};

function cn(...classNames: Array<string | false | null | undefined>) {
	return classNames.filter(Boolean).join(' ');
}

export default function StatusCombobox({
	value,
	onValueChange,
	options,
	placeholder = 'Select status',
}: StatusComboboxProps) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function onOutsideClick(event: MouseEvent) {
			if (!containerRef.current) {
				return;
			}
			if (!containerRef.current.contains(event.target as Node)) {
				setOpen(false);
			}
		}

		document.addEventListener('mousedown', onOutsideClick);
		return () => document.removeEventListener('mousedown', onOutsideClick);
	}, []);

	const selectedOption = useMemo(
		() => options.find((item) => item.value === value),
		[options, value]
	);

	const filteredOptions = useMemo(() => {
		const normalized = query.trim().toLowerCase();
		if (!normalized) {
			return options;
		}

		return options.filter((item) =>
			item.label.toLowerCase().includes(normalized)
		);
	}, [options, query]);

	return (
		<div className="relative" ref={containerRef}>
			<button
				type="button"
				onClick={() => setOpen((prev) => !prev)}
				className="cursor-pointer flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-2 text-left text-sm shadow-sm outline-none transition hover:border-blue-400 focus:ring-2 focus:ring-blue-500"
				aria-expanded={open}
				aria-label="Select status"
			>
				<span className="flex min-w-0 items-center gap-2">
					{selectedOption ? (
						<span className="text-slate-700">{selectedOption.label}</span>
					) : (
						<span className="text-slate-500">{placeholder}</span>
					)}
				</span>
				<ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
			</button>

			{open && (
				<div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
					<div className="border-b border-slate-100 p-2">
						<label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-600 focus-within:border-blue-300 focus-within:bg-white">
							<Search className="h-4 w-4" />
							<input
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Search status..."
								className="w-full bg-transparent outline-none"
							/>
						</label>
					</div>

					<div className="max-h-64 overflow-y-auto p-2">
						{filteredOptions.length === 0 && (
							<p className="px-2 py-4 text-sm text-slate-500">
								No status found.
							</p>
						)}

						{filteredOptions.map((item) => (
							<button
								type="button"
								key={item.value}
								onClick={() => {
									onValueChange(item.value);
									setOpen(false);
									setQuery('');
								}}
								className="cursor-pointer flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition hover:bg-slate-50"
							>
								<span className="text-sm font-medium text-slate-700">
									{item.label}
								</span>

								<Check
									className={cn(
										'h-4 w-4 text-blue-600',
										value === item.value ? 'opacity-100' : 'opacity-0'
									)}
								/>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
